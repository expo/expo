export default class MutableValue<T> {
  static MUTABLE_ID = 1;
  _id: number;
  _value: T;
  _setter: (value: T) => void;
  _animation = null;
  _listeners: (() => void)[] = [];

  constructor(value: T, setter: (value: T) => void) {
    this._id = MutableValue.MUTABLE_ID++;
    this._value = value;
    this._setter = setter;
  }

  get value(): T {
    return this._value;
  }

  set value(nextValue: T) {
    this._setter(nextValue);
  }

  // this changes the value finally and is supposed to be called from this._setter
  _setValue(newValue: T): void {
    this._value = newValue;
    this._triggerListener();
  }

  addListener(listener: () => void): void {
    this._listeners.push(listener);
  }

  _triggerListener(): void {
    for (let i = 0, len = this._listeners.length; i < len; ++i) {
      this._listeners[i]();
    }
  }
}
