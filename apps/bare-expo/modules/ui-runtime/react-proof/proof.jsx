import React, { useEffect, useLayoutEffect, useState } from 'react';

import { createRoot } from './renderer';

let root;
let setCount;
let renders = 0;
let layoutMounts = 0;
let layoutCleanups = 0;
let effectMounts = 0;
let effectCleanups = 0;
let committedCount = -1;
const snapshots = {};

function check(condition, message) {
  if (!condition) throw new Error(message);
}

// Ordinary JSX and hooks. No worklet directive and no second template.
function Counter() {
  check(__isUIThread(), 'React rendered off the UI thread');
  const [count, updateCount] = useState(0);
  renders++;
  useLayoutEffect(() => {
    layoutMounts++;
    setCount = updateCount;
    return () => {
      layoutCleanups++;
      setCount = undefined;
    };
  }, []);
  useLayoutEffect(() => {
    committedCount = count;
  }, [count]);
  useEffect(() => {
    effectMounts++;
    return () => {
      effectCleanups++;
    };
  }, []);
  return (
    <row count={count}>
      <label>{count}</label>
      {count % 2 === 1 ? <badge>odd</badge> : null}
    </row>
  );
}

function assertTree(count) {
  const tree = root.snapshot();
  check(tree.length === 1 && tree[0].props.count === count, 'Host props were not committed');
  check(tree[0].children[0].children[0].text === String(count), 'Text was not committed');
  check(tree[0].children.length === (count % 2 ? 2 : 1), 'Conditional child reconciliation failed');
  return tree;
}

globalThis.UIReactProof = {
  start() {
    check(!root, 'Start each proof in a fresh runtime');
    check(typeof __uiReactAppMarker === 'undefined', 'App runtime globals leaked into React');
    check(React.version === '19.2.3', 'Unexpected React version');
    root = createRoot();
    root.renderSync(<Counter />);
    snapshots.initial = assertTree(0);
    root.updateSync(() => setCount((count) => count + 1));
    snapshots.synchronous = assertTree(1);
    // No flush here: the actual React Scheduler must run this update later
    // via setImmediate -> native UIExecutionQueue -> the same Hermes engine.
    setCount((count) => count + 1);
    check(committedCount === 1, 'Deferred update unexpectedly committed inline');
    return { initial: snapshots.initial, synchronous: snapshots.synchronous };
  },
  ready() {
    return committedCount === 2;
  },
  finish() {
    check(committedCount === 2, 'Deferred state update did not commit');
    snapshots.deferred = assertTree(2);
    root.renderSync(null);
    root.flushEffects();
    check(root.snapshot().length === 0, 'Unmount left host children');
    check(layoutMounts === 1 && layoutCleanups === 1, 'Layout effect cleanup failed');
    check(effectMounts === 1 && effectCleanups === 1, 'Passive effect cleanup failed');
    root = createRoot();
    root.renderSync(<Counter />);
    assertTree(0);
    root.renderSync(null);
    root.flushEffects();
    check(layoutCleanups === 2 && effectCleanups === 2, 'Remount cleanup failed');
    return {
      checks: {
        appIsolation: true,
        conditionalChildren: true,
        deferredStateUpdate: true,
        effectCleanup: true,
        reactOnUI: true,
        remountResetsState: true,
        synchronousMount: true,
        synchronousStateUpdate: true,
      },
      snapshots,
      renders,
      reactVersion: React.version,
    };
  },
};
