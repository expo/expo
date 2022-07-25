export default {
  async disconnectNodeFromView(): Promise<void> {
    // noop
  },
  async attachEvent(
    _viewTag: number,
    _eventName: string,
    _nodeID: number
  ): Promise<void> {
    // noop
  },
  async detachEvent(
    _viewTag: number,
    _eventName: string,
    _nodeID: number
  ): Promise<void> {
    // noop
  },
  async createNode(
    _nodeID: number,
    _config: Record<string, unknown>
  ): Promise<void> {
    // noop
  },
  async dropNode(_nodeID: number): Promise<void> {
    // noop
  },
  async configureProps(
    _nativeProps: string[],
    _uiProps: string[]
  ): Promise<void> {
    // noop
  },
  async disconnectNodes(): Promise<void> {
    // noop
  },
  async addListener(): Promise<void> {
    // noop
  },
  async removeListeners(): Promise<void> {
    // noop
  },
  async removeAllListeners(): Promise<void> {
    // noop
  },
  async animateNextTransition(): Promise<void> {
    console.warn(
      'Reanimated: animateNextTransition is unimplemented on current platform'
    );
  },
};
