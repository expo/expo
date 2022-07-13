const NOOP = () => {
  // noop
};

export default {
  configureProps: NOOP,
  connectNodes: NOOP,
  getValue: () => 0,
  disconnectNodes: NOOP,
  createNode: NOOP,
};
