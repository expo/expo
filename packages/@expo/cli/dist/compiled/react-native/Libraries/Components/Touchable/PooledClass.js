'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _invariant = _interopRequireDefault(require("invariant"));
var oneArgumentPooler = function oneArgumentPooler(copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var _instance = Klass.instancePool.pop();
    Klass.call(_instance, copyFieldsFrom);
    return _instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};
var twoArgumentPooler = function twoArgumentPooler(a1, a2) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var _instance2 = Klass.instancePool.pop();
    Klass.call(_instance2, a1, a2);
    return _instance2;
  } else {
    return new Klass(a1, a2);
  }
};
var threeArgumentPooler = function threeArgumentPooler(a1, a2, a3) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var _instance3 = Klass.instancePool.pop();
    Klass.call(_instance3, a1, a2, a3);
    return _instance3;
  } else {
    return new Klass(a1, a2, a3);
  }
};
var fourArgumentPooler = function fourArgumentPooler(a1, a2, a3, a4) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var _instance4 = Klass.instancePool.pop();
    Klass.call(_instance4, a1, a2, a3, a4);
    return _instance4;
  } else {
    return new Klass(a1, a2, a3, a4);
  }
};
var standardReleaser = function standardReleaser(instance) {
  var Klass = this;
  (0, _invariant.default)(instance instanceof Klass, 'Trying to release an instance into a pool of a different type.');
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};
var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;
var addPoolingTo = function addPoolingTo(CopyConstructor, pooler) {
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};
var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler,
  threeArgumentPooler: threeArgumentPooler,
  fourArgumentPooler: fourArgumentPooler
};
module.exports = PooledClass;