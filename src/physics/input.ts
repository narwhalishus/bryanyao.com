import Matter from 'matter-js';
import type {BoundObject} from './bodies';

interface DragState {
  obj: BoundObject;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  lastX: number;
  lastY: number;
  vx: number;
  vy: number;
  moved: boolean;
}

const DRAG_THRESHOLD_PX = 6;

export function attachInput(container: HTMLElement, bound: BoundObject[]) {
  const byEl = new Map<HTMLElement, BoundObject>();
  for (const o of bound) byEl.set(o.el, o);

  let drag: DragState | null = null;

  const findObj = (el: HTMLElement | null): BoundObject | null => {
    while (el && el !== container) {
      if (el.classList.contains('obj') && byEl.has(el)) {
        return byEl.get(el) || null;
      }
      el = el.parentElement;
    }
    return null;
  };

  const onPointerDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement;
    const obj = findObj(target);
    if (!obj) return;

    // Don't hijack clicks on anchors/buttons that have external hrefs — but
    // we do still want to start a drag. We'll decide between click and drag
    // based on movement distance.
    const rect = obj.el.getBoundingClientRect();
    const pointerX = e.clientX;
    const pointerY = e.clientY;

    drag = {
      obj,
      pointerId: e.pointerId,
      offsetX: pointerX - (rect.left + rect.width / 2),
      offsetY: pointerY - (rect.top + rect.height / 2),
      lastX: pointerX,
      lastY: pointerY,
      vx: 0,
      vy: 0,
      moved: false,
    };

    // Note: pointer capture is deliberately *not* set here. Capturing on the
    // .obj wrapper would retarget the synthesized click to the wrapper div,
    // skipping the inner <a>/<button>'s default action — so a pure click on
    // an anchor-backed desk object would fail to navigate. Capture is set
    // lazily in onPointerMove once the pointer crosses the drag threshold.
    Matter.Body.setStatic(obj.body, false);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    drag.vx = dx;
    drag.vy = dy;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;

    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD_PX) {
      drag.moved = true;
      // Now that we know this is a drag, capture the pointer so the stream
      // continues even if the pointer leaves the element's visible rect.
      // setPointerCapture can throw if the pointer is not active (e.g. in
      // synthetic-event test harnesses); losing capture would degrade drag
      // smoothness but not break it, so swallow the error.
      try {
        drag.obj.el.setPointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
      // Mark so the drawer/link handler knows to ignore the synthesized click.
      const tag = drag.obj.el.querySelector<HTMLElement>('[data-obj]');
      if (tag) tag.dataset.dragging = '1';
    }

    const cRect = container.getBoundingClientRect();
    const x = e.clientX - cRect.left - drag.offsetX;
    const y = e.clientY - cRect.top - drag.offsetY;
    Matter.Body.setPosition(drag.obj.body, {x, y});
    Matter.Body.setVelocity(drag.obj.body, {x: drag.vx, y: drag.vy});
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const wasMoved = drag.moved;
    const obj = drag.obj;
    // Apply release velocity so the object flings.
    Matter.Body.setVelocity(obj.body, {x: drag.vx * 0.8, y: drag.vy * 0.8});
    // Only release if we captured — capture is set lazily after the drag
    // threshold, so a pure click never owns the pointer in the first place.
    if (wasMoved && obj.el.hasPointerCapture?.(e.pointerId)) {
      obj.el.releasePointerCapture(e.pointerId);
    }
    drag = null;

    if (wasMoved) {
      // Suppress the click that browsers synthesize right after.
      const tag = obj.el.querySelector<HTMLElement>('[data-obj]');
      if (tag) {
        // Keep dragging flag set across the click tick, then clear.
        setTimeout(() => {
          tag.dataset.dragging = '0';
        }, 60);
      }
    }
  };

  // Capture-phase click guard: if the object was dragged, swallow the synthetic
  // click so <a> navigation and drawer triggers don't fire.
  const onClickCapture = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    const tag = target?.closest<HTMLElement>('[data-obj]');
    if (tag?.dataset.dragging === '1') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Anchors within the desk have draggable=true by default, which triggers
  // the browser's native URL drag and cancels our pointer stream mid-drag.
  const onDragStart = (e: DragEvent) => {
    if ((e.target as HTMLElement | null)?.closest('.obj')) e.preventDefault();
  };

  container.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  container.addEventListener('click', onClickCapture, true);
  container.addEventListener('dragstart', onDragStart);

  return () => {
    container.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    container.removeEventListener('click', onClickCapture, true);
    container.removeEventListener('dragstart', onDragStart);
  };
}
