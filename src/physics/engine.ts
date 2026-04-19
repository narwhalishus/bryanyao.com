import Matter from 'matter-js';

export interface PhysicsContext {
  engine: Matter.Engine;
  world: Matter.World;
  container: HTMLElement;
  walls: Matter.Body[];
  running: boolean;
  stop: () => void;
}

export function createPhysics(container: HTMLElement): PhysicsContext {
  const engine = Matter.Engine.create({
    gravity: {x: 0, y: 0, scale: 0},
    enableSleeping: true,
  });

  const world = engine.world;

  const walls: Matter.Body[] = [];
  const ctx: PhysicsContext = {
    engine,
    world,
    container,
    walls,
    running: true,
    stop,
  };

  rebuildWalls(ctx);

  const ro = new ResizeObserver(() => rebuildWalls(ctx));
  ro.observe(container);

  let rafId = 0;
  let last = performance.now();
  const step = (now: number) => {
    if (!ctx.running) return;
    // Matter recommends dt ≤ 16.667ms for stability. A long first-frame gap or
    // a backgrounded tab resuming can hand us 100+ ms here, which would both
    // warn and tunnel bodies through walls.
    const dt = Math.min(16.667, now - last);
    last = now;
    Matter.Engine.update(engine, dt);
    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);

  function stop() {
    ctx.running = false;
    cancelAnimationFrame(rafId);
    ro.disconnect();
    Matter.World.clear(world, false);
    Matter.Engine.clear(engine);
  }

  return ctx;
}

export function rebuildWalls(ctx: PhysicsContext) {
  const rect = ctx.container.getBoundingClientRect();
  Matter.World.remove(ctx.world, ctx.walls);
  ctx.walls.length = 0;
  const t = 200;
  const opts: Matter.IBodyDefinition = {
    isStatic: true,
    restitution: 0.25,
    friction: 0.02,
    frictionStatic: 0.04,
  };
  const top = Matter.Bodies.rectangle(rect.width / 2, -t / 2, rect.width + t * 2, t, opts);
  const bot = Matter.Bodies.rectangle(rect.width / 2, rect.height + t / 2, rect.width + t * 2, t, opts);
  const left = Matter.Bodies.rectangle(-t / 2, rect.height / 2, t, rect.height + t * 2, opts);
  const right = Matter.Bodies.rectangle(rect.width + t / 2, rect.height / 2, t, rect.height + t * 2, opts);
  ctx.walls.push(top, bot, left, right);
  Matter.World.add(ctx.world, ctx.walls);
}
