// Fast JS regression check. This simulates the native task transport; only the
// separate iOS harness proves actual Hermes/UI-thread ownership.
require('./build.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../ios/Resources/UIReactProof.js'), 'utf8');
const babel = require('@babel/core');
// Guard the bundling regression caught by Hermes, even when testing in Node.
babel.traverse(babel.parseSync(source, { configFile: false, babelrc: false }), {
  VariableDeclaration(path) {
    assert.equal(path.node.kind, 'var', 'The Hermes bundle must lower block-scoped declarations');
  },
});

for (let run = 0; run < 2; run++) {
  const tasks = [];
  const context = vm.createContext({
    __postUITask: (id) => tasks.push(id),
    __uiNow: () => performance.now(),
    __isUIThread: () => true,
  });
  vm.runInContext(source, context);
  context.UIReactProof.start();
  assert.equal(context.UIReactProof.ready(), false);
  let turns = 0;
  while (tasks.length) {
    assert.ok(++turns < 100, 'Scheduler failed to settle');
    context.__runUITask(tasks.shift());
  }
  assert.equal(context.UIReactProof.ready(), true);
  const result = JSON.parse(JSON.stringify(context.UIReactProof.finish()));
  assert.equal(Object.keys(result.checks).length, 8);
  assert.ok(Object.values(result.checks).every(Boolean));
  assert.equal(result.snapshots.initial[0].props.count, 0);
  assert.equal(result.snapshots.synchronous[0].props.count, 1);
  assert.equal(result.snapshots.deferred[0].props.count, 2);
  while (tasks.length) {
    assert.ok(++turns < 100);
    context.__runUITask(tasks.shift());
  }
  vm.runInContext(
    'clearImmediate(setImmediate(() => { throw new Error("cancel failed"); }))',
    context,
  );
  context.__runUITask(tasks.shift());
  console.log(`React proof ${run + 1} passed (${turns} deferred callbacks).`);
}
