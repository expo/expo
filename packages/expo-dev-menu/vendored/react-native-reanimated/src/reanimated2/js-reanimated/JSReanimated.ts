// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import MapperRegistry from './MapperRegistry';
import MutableValue from './MutableValue';
import Mapper from './Mapper';

export default class JSReanimated {
  native = false;
  _valueSetter = undefined;
  _renderRequested = false;
  _mapperRegistry = new MapperRegistry(this);
  _frames = [];
  timeProvider = {};

  constructor() {
    if (process.env.JEST_WORKER_ID) {
      this.timeProvider.now = () => Date.now();
    } else {
      this.timeProvider.now = () => window.performance.now();
    }
  }

  pushFrame(frame) {
    this._frames.push(frame);
    this.maybeRequestRender();
  }

  getTimestamp() {
    return this.timeProvider.now();
  }

  maybeRequestRender() {
    if (!this._renderRequested) {
      this._renderRequested = true;

      requestAnimationFrame((_timestampMs) => {
        this._renderRequested = false;

        this._onRender(this.getTimestamp());
      });
    }
  }

  _onRender(timestampMs) {
    this._mapperRegistry.execute();

    const frames = [...this._frames];
    this._frames = [];

    for (let i = 0, len = frames.length; i < len; ++i) {
      frames[i](timestampMs);
    }

    if (this._mapperRegistry.needRunOnRender) {
      this._mapperRegistry.execute();
    }
  }

  installCoreFunctions(valueSetter) {
    this._valueSetter = valueSetter;
  }

  makeShareable(value) {
    return value;
  }

  makeMutable(value) {
    return new MutableValue(value, this._valueSetter);
  }

  makeRemote(object) {
    return object;
  }

  startMapper(mapper, inputs = [], outputs = []) {
    const instance = new Mapper(this, mapper, inputs, outputs);
    const mapperId = this._mapperRegistry.startMapper(instance);
    this.maybeRequestRender();
    return mapperId;
  }

  stopMapper(mapperId) {
    this._mapperRegistry.stopMapper(mapperId);
  }

  registerEventHandler(_eventHash, _eventHandler) {
    // noop
  }

  unregisterEventHandler(_registrationId) {
    // noop
  }
}
