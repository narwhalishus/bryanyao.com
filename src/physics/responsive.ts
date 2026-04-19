import {createPhysics} from './engine';
import {buildBodies, syncTransforms} from './bodies';
import {attachInput} from './input';

const DESKTOP_MIN = 769;

/**
 * Boot physics only if the viewport is wide enough and the user has not
 * asked for reduced motion. Returns a teardown function.
 */
export function maybeBootDesk(container: HTMLElement): (() => void) | null {
  if (window.innerWidth < DESKTOP_MIN) return null;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  const ctx = createPhysics(container);
  const bound = buildBodies(container, ctx.world);
  const detachInput = attachInput(container, bound);

  let rafId = 0;
  const loop = () => {
    syncTransforms(bound);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId);
    detachInput();
    ctx.stop();
  };
}
