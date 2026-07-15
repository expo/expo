'use strict';
// ES5-style EventEmitter so legacy `EventEmitter.call(this)` inheritance works.
function EventEmitter() {
  if (!this._events) this._events = Object.create(null);
}
EventEmitter.prototype._ensure = function () {
  if (!this._events) this._events = Object.create(null);
  return this._events;
};
EventEmitter.prototype.on = function (name, fn) {
  const ev = this._ensure();
  (ev[name] = ev[name] || []).push(fn);
  return this;
};
EventEmitter.prototype.addListener = EventEmitter.prototype.on;
EventEmitter.prototype.prependListener = function (name, fn) {
  const ev = this._ensure();
  (ev[name] = ev[name] || []).unshift(fn);
  return this;
};
EventEmitter.prototype.once = function (name, fn) {
  const self = this;
  function wrap(...args) {
    self.removeListener(name, wrap);
    fn.apply(self, args);
  }
  wrap.listener = fn;
  return this.on(name, wrap);
};
EventEmitter.prototype.removeListener = function (name, fn) {
  const ev = this._ensure();
  if (ev[name]) ev[name] = ev[name].filter((f) => f !== fn && f.listener !== fn);
  return this;
};
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.removeAllListeners = function (name) {
  const ev = this._ensure();
  if (name) delete ev[name];
  else this._events = Object.create(null);
  return this;
};
EventEmitter.prototype.emit = function (name, ...args) {
  const ev = this._ensure();
  const list = ev[name];
  if (!list || list.length === 0) {
    if (name === 'error') throw args[0];
    return false;
  }
  for (const fn of [...list]) fn.apply(this, args);
  return true;
};
EventEmitter.prototype.listeners = function (name) {
  return [...(this._ensure()[name] || [])];
};
EventEmitter.prototype.listenerCount = function (name) {
  return (this._ensure()[name] || []).length;
};
EventEmitter.prototype.setMaxListeners = function () { return this; };
EventEmitter.prototype.getMaxListeners = function () { return Infinity; };

EventEmitter.EventEmitter = EventEmitter;
EventEmitter.once = (emitter, name) => new Promise((res) => emitter.once(name, (...args) => res(args)));
EventEmitter.defaultMaxListeners = 10;
module.exports = EventEmitter;
