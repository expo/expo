// Diagnostic host only. These objects are NOT Fabric nodes or RN components.
// Real React reconciliation targets this tiny tree so we can test the runtime
// and scheduler before introducing a native mounting implementation.
import React from 'react';
import Reconciler from 'react-reconciler';
import { ConcurrentRoot, DefaultEventPriority, NoEventPriority } from 'react-reconciler/constants';

const context = {};
let priority = NoEventPriority;
const noop = () => {};
const unsupported = () => {
  throw new Error('This React proof does not support timers or Suspense');
};
const propsWithoutChildren = ({ children, ...props }) => props;

function remove(parent, child) {
  const index = parent.children.indexOf(child);
  if (index !== -1) parent.children.splice(index, 1);
}
function append(parent, child) {
  remove(parent, child); // React may move an existing keyed child.
  parent.children.push(child);
}
function insert(parent, child, before) {
  remove(parent, child);
  const index = parent.children.indexOf(before);
  if (index === -1) throw new Error('Missing insertion anchor');
  parent.children.splice(index, 0, child);
}

const reconciler = Reconciler({
  rendererVersion: '0.0.1',
  rendererPackageName: 'ui-runtime-react-proof',
  isPrimaryRenderer: true,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  supportsMicrotasks: false, // Use Scheduler's setImmediate path, not fake microtasks.
  getRootHostContext: () => context,
  getChildHostContext: () => context,
  getPublicInstance: (instance) => instance,
  prepareForCommit: () => null,
  resetAfterCommit: noop,
  createInstance: (type, props) => ({ type, props: propsWithoutChildren(props), children: [] }),
  createTextInstance: (text) => ({ text }),
  appendInitialChild: append,
  appendChild: append,
  appendChildToContainer: append,
  insertBefore: insert,
  insertInContainerBefore: insert,
  removeChild: remove,
  removeChildFromContainer: remove,
  clearContainer: (container) => {
    container.children = [];
  },
  finalizeInitialChildren: () => false,
  shouldSetTextContent: () => false,
  commitUpdate: (instance, type, oldProps, newProps) => {
    instance.props = propsWithoutChildren(newProps);
  },
  commitTextUpdate: (instance, oldText, newText) => {
    instance.text = newText;
  },
  detachDeletedInstance: noop,
  getCurrentUpdatePriority: () => priority,
  setCurrentUpdatePriority: (value) => {
    priority = value;
  },
  resolveUpdatePriority: () => priority || DefaultEventPriority,
  shouldAttemptEagerTransition: () => false,
  maySuspendCommit: () => false,
  maySuspendCommitOnUpdate: () => false,
  maySuspendCommitInSyncRender: () => false,
  preloadInstance: () => true,
  startSuspendingCommit: unsupported,
  suspendInstance: unsupported,
  waitForCommitToBeReady: () => null,
  scheduleTimeout: unsupported,
  cancelTimeout: noop,
  noTimeout: -1,
  NotPendingTransition: null,
  HostTransitionContext: React.createContext(null),
  resetFormInstance: noop,
});

export function createRoot() {
  const container = { children: [] };
  const errors = [];
  const reportError = (error) => errors.push(error);
  const root = reconciler.createContainer(
    container,
    ConcurrentRoot,
    null,
    false,
    null,
    '',
    reportError,
    reportError,
    reportError,
    noop
  );
  function assertHealthy() {
    if (errors.length) throw errors.shift();
  }
  return {
    renderSync(element) {
      reconciler.updateContainerSync(element, root, null, null);
      reconciler.flushSyncWork();
      assertHealthy();
    },
    updateSync(update) {
      reconciler.flushSyncFromReconciler(update);
      assertHealthy();
    },
    flushEffects() {
      reconciler.flushPassiveEffects();
      assertHealthy();
    },
    snapshot() {
      assertHealthy();
      return JSON.parse(JSON.stringify(container.children));
    },
  };
}
