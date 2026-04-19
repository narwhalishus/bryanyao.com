import Matter from 'matter-js';

export interface BoundObject {
  id: string;
  el: HTMLElement;
  body: Matter.Body;
  width: number;
  height: number;
}

type Shape = 'circle' | 'rect';

interface ShapeSpec {
  shape: Shape;
  // extra options per body
  density?: number;
  frictionAir?: number;
  restitution?: number;
}

const OBJECT_SHAPES: Record<string, ShapeSpec> = {
  medallion: {shape: 'circle', density: 0.003, frictionAir: 0.08, restitution: 0.2},
  keyfob: {shape: 'rect', density: 0.0015, frictionAir: 0.07, restitution: 0.25},
  'film-canister': {shape: 'rect', density: 0.002, frictionAir: 0.08, restitution: 0.2},
  'calling-card': {shape: 'rect', density: 0.0009, frictionAir: 0.09, restitution: 0.15},
  'wax-seal': {shape: 'circle', density: 0.0025, frictionAir: 0.1, restitution: 0.15},
  stamp: {shape: 'rect', density: 0.0018, frictionAir: 0.09, restitution: 0.18},
  'recipe-notebook': {shape: 'rect', density: 0.003, frictionAir: 0.11, restitution: 0.1},
  'working-on': {shape: 'rect', density: 0.0009, frictionAir: 0.08, restitution: 0.18},
  watch: {shape: 'circle', density: 0.004, frictionAir: 0.09, restitution: 0.2},
  vinyl: {shape: 'circle', density: 0.0022, frictionAir: 0.06, restitution: 0.22},
  'chalk-bag': {shape: 'rect', density: 0.0028, frictionAir: 0.11, restitution: 0.15},
  cufflinks: {shape: 'rect', density: 0.0018, frictionAir: 0.1, restitution: 0.2},
};

/**
 * Create a Matter body for each DOM element tagged with [data-obj].
 * Returns the mapping so the render loop can sync transforms.
 */
export function buildBodies(container: HTMLElement, world: Matter.World): BoundObject[] {
  const wrappers = Array.from(container.querySelectorAll<HTMLElement>('.obj'));
  const bound: BoundObject[] = [];

  for (const wrapper of wrappers) {
    const tag = wrapper.querySelector<HTMLElement>('[data-obj]');
    if (!tag) continue;
    const id = tag.dataset.obj!;
    const spec = OBJECT_SHAPES[id] ?? {shape: 'rect'};

    const rect = tag.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const cx = rect.left - containerRect.left + rect.width / 2;
    const cy = rect.top - containerRect.top + rect.height / 2;

    // Tell the element to ignore CSS offset so body position is authoritative.
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.transform = `translate(${cx - rect.width / 2}px, ${cy - rect.height / 2}px)`;

    const opts: Matter.IBodyDefinition = {
      density: spec.density ?? 0.002,
      frictionAir: spec.frictionAir ?? 0.08,
      frictionStatic: 0.2,
      friction: 0.1,
      restitution: spec.restitution ?? 0.2,
      slop: 0.02,
      label: id,
    };

    let body: Matter.Body;
    if (spec.shape === 'circle') {
      body = Matter.Bodies.circle(cx, cy, Math.min(rect.width, rect.height) / 2, opts);
    } else {
      body = Matter.Bodies.rectangle(cx, cy, rect.width, rect.height, opts);
    }

    // Give each body a little initial linear damping nudge to settle visually.
    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.002);

    Matter.World.add(world, body);
    bound.push({id, el: wrapper, body, width: rect.width, height: rect.height});
  }

  return bound;
}

/**
 * Apply Matter body positions back to DOM via CSS transform.
 */
export function syncTransforms(bound: BoundObject[]) {
  for (const o of bound) {
    const {body, el, width, height} = o;
    const x = body.position.x - width / 2;
    const y = body.position.y - height / 2;
    const deg = (body.angle * 180) / Math.PI;
    el.style.transform = `translate(${x}px, ${y}px) rotate(${deg}deg)`;
  }
}
