export default {
  async disconnectNodeFromView() {
    // noop
  },
  async attachEvent(viewTag, eventName, nodeID) {
    // noop
  },
  async detachEvent(viewTag, eventName, nodeID) {
    // noop
  },
  async createNode(nodeID, config) {
    // noop
  },
  async dropNode(nodeID) {
    // noop
  },
  async configureProps() {
    // noop
  },
  async disconnectNodes() {
    // noop
  },
  async animateNextTransition() {
    console.warn('Reanimated: animateNextTransition is unimplemented on current platform');
  },
};
