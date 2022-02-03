// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import MutableValue from './MutableValue';

global._setGlobalConsole = (_val) => {
  // noop
};

const NOOP = () => {
  // noop
};

export default {
  installCoreFunctions: NOOP,
  makeShareable: (worklet) => worklet,
  makeMutable: (init) => new MutableValue(init),
  makeRemote: NOOP,
  startMapper: NOOP,
  stopMapper: NOOP,
  registerEventHandler: NOOP,
  unregisterEventHandler: NOOP,
  getViewProp: NOOP,
};
