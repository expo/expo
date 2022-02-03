// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export default class MutableValue {
  constructor(value) {
    this._value = value;
  }

  get value() {
    return this._value;
  }

  set value(nextValue) {
    this._value = nextValue;
  }
}
