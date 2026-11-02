const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const context = vm.createContext({
  document: { getElementById: () => ({ width: 400, height: 600, getContext: () => new Proxy({}, { get: () => () => {} }), addEventListener() {} }) },
  addEventListener() {}, requestAnimationFrame() {},
});
context.document.createElement = () => context.document.getElementById();
vm.runInContext(source, context);
vm.runInContext(`
  state = 'playing';
  pipes = [{ x: 25, top: 100, scored: false }, { x: 300, top: 100, scored: false }];
  update();
  if (score !== 1) throw new Error('Passing a pipe must score once');
  bird.y = 300; bird.vy = 0;
  const first = pipes[1].x;
  update();
  if (Math.abs(first - pipes[1].x - 3) > 1e-9) throw new Error('First point must increase speed 20%');
  pipes[1].x = 25;
  update();
  if (score !== 2) throw new Error('Each pipe must score exactly once');
  pipes.push({ x: 300, top: 100, scored: false });
  bird.y = 300; bird.vy = 0;
  update();
  if (Math.abs(pipes.at(-1).x - 296.4) > 1e-9) throw new Error('Second point must compound speed to 3.6');
  reset(); state = 'playing';
  pipes = [{ x: 300, top: 100, scored: false }];
  update();
  if (pipes[0].x !== 297.5 || score !== 0) throw new Error('Restart must restore initial speed');
  reset(); state = 'playing';
  pipes = [{ x: 90, top: 310, scored: false }];
  update();
  if (state !== 'dead') throw new Error('Hitting a pipe must end the game');
  reset(); state = 'playing';
  pipes = [{ x: 90, top: 200, scored: false }];
  update();
  if (state !== 'playing') throw new Error('Flying through the gap must remain safe');
`, context);
assert.ok(true);
console.log('Passed: per-pipe scoring, compounded 20% speed, restart reset');
