// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export default class MutableValue {
  static MUTABLE_ID = 1;

  _animation = null;
  _listeners = [];

  constructor(value, setter) {
    this._id = MutableValue.MUTABLE_ID++;
    this._value = value;
    this._setter = setter;
  }

  get value() {
    return this._value;
  }

  set value(nextValue) {
    this._setter(nextValue);
  }

  // this changes the value finally and is supposed to be called from this._setter
  _setValue(newValue) {
    this._value = newValue;
    this._triggerListener();
  }

  addListener(listener) {
    this._listeners.push(listener);
  }

  _triggerListener() {
    for (let i = 0, len = this._listeners.length; i < len; ++i) {
      this._listeners[i]();
    }
  }
}
