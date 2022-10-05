import MapperRegistry from './MapperRegistry';
import Mapper from './Mapper';
import MutableValue from './MutableValue';
import { NativeReanimated } from '../NativeReanimated/NativeReanimated';
import {
  Timestamp,
  NestedObjectValues,
  AnimatedKeyboardInfo,
} from '../commonTypes';
import { isJest } from '../PlatformChecker';

export default class JSReanimated extends NativeReanimated {
  _valueSetter?: <T>(value: T) => void = undefined;

  _renderRequested = false;
  _mapperRegistry: MapperRegistry<any> = new MapperRegistry(this);
  _frames: ((timestamp: Timestamp) => void)[] = [];
  timeProvider: { now: () => number };

  constructor() {
    super(false);
    if (isJest()) {
      this.timeProvider = { now: () => global.ReanimatedDataMock.now() };
    } else {
      this.timeProvider = { now: () => window.performance.now() };
    }
  }

  pushFrame(frame: (timestamp: Timestamp) => void): void {
    this._frames.push(frame);
    this.maybeRequestRender();
  }

  getTimestamp(): number {
    return this.timeProvider.now();
  }

  maybeRequestRender(): void {
    if (!this._renderRequested) {
      this._renderRequested = true;

      requestAnimationFrame((_timestampMs) => {
        this._renderRequested = false;

        this._onRender(this.getTimestamp());
      });
    }
  }

  _onRender(timestampMs: number): void {
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

  installCoreFunctions(valueSetter: <T>(value: T) => void): void {
    this._valueSetter = valueSetter;
  }

  makeShareable<T>(value: T): T {
    return value;
  }

  makeMutable<T>(value: T): MutableValue<T> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return new MutableValue(value, this._valueSetter!);
  }

  makeRemote<T>(object = {}): T {
    return object as T;
  }

  startMapper(
    mapper: () => void,
    inputs: NestedObjectValues<MutableValue<unknown>>[] = [],
    outputs: NestedObjectValues<MutableValue<unknown>>[] = []
  ): number {
    const instance = new Mapper(this, mapper, inputs, outputs);
    const mapperId = this._mapperRegistry.startMapper(instance);
    this.maybeRequestRender();
    return mapperId;
  }

  stopMapper(mapperId: number): void {
    this._mapperRegistry.stopMapper(mapperId);
  }

  registerEventHandler<T>(_: string, __: (event: T) => void): string {
    // noop
    return '';
  }

  unregisterEventHandler(_: string): void {
    // noop
  }

  enableLayoutAnimations() {
    console.warn(
      '[Reanimated] enableLayoutAnimations is not available for WEB yet'
    );
  }

  registerSensor(): number {
    console.warn('[Reanimated] useAnimatedSensor is not available on web yet.');
    return -1;
  }

  unregisterSensor(): void {
    // noop
  }

  jestResetModule() {
    if (isJest()) {
      /**
       * If someone used timers to stop animation before the end,
       * then _renderRequested was set as true
       * and any new update from another test wasn't applied.
       */
      this._renderRequested = false;
    } else {
      throw Error('This method can be only use in Jest testing.');
    }
  }

  subscribeForKeyboardEvents(_: AnimatedKeyboardInfo): number {
    console.warn(
      '[Reanimated] useAnimatedKeyboard is not available on web yet.'
    );
    return -1;
  }

  unsubscribeFromKeyboardEvents(_: number): void {
    // noop
  }
}
