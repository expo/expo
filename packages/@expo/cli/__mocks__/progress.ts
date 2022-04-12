class Progress {
  tick: Function;
  terminate: Function;
  constructor() {
    this.tick = jest.fn();
    this.terminate = jest.fn();
  }
}

export default Progress;
