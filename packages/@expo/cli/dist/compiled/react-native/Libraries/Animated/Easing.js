'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _ease;
var Easing = {
  step0: function step0(n) {
    return n > 0 ? 1 : 0;
  },
  step1: function step1(n) {
    return n >= 1 ? 1 : 0;
  },
  linear: function linear(t) {
    return t;
  },
  ease: function ease(t) {
    if (!_ease) {
      _ease = Easing.bezier(0.42, 0, 1, 1);
    }
    return _ease(t);
  },
  quad: function quad(t) {
    return t * t;
  },
  cubic: function cubic(t) {
    return t * t * t;
  },
  poly: function poly(n) {
    return function (t) {
      return Math.pow(t, n);
    };
  },
  sin: function sin(t) {
    return 1 - Math.cos(t * Math.PI / 2);
  },
  circle: function circle(t) {
    return 1 - Math.sqrt(1 - t * t);
  },
  exp: function exp(t) {
    return Math.pow(2, 10 * (t - 1));
  },
  elastic: function elastic() {
    var bounciness = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var p = bounciness * Math.PI;
    return function (t) {
      return 1 - Math.pow(Math.cos(t * Math.PI / 2), 3) * Math.cos(t * p);
    };
  },
  back: function back() {
    var s = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1.70158;
    return function (t) {
      return t * t * ((s + 1) * t - s);
    };
  },
  bounce: function bounce(t) {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    }
    if (t < 2 / 2.75) {
      var _t = t - 1.5 / 2.75;
      return 7.5625 * _t * _t + 0.75;
    }
    if (t < 2.5 / 2.75) {
      var _t2 = t - 2.25 / 2.75;
      return 7.5625 * _t2 * _t2 + 0.9375;
    }
    var t2 = t - 2.625 / 2.75;
    return 7.5625 * t2 * t2 + 0.984375;
  },
  bezier: function bezier(x1, y1, x2, y2) {
    var _bezier = require('./bezier').default;
    return _bezier(x1, y1, x2, y2);
  },
  in: function _in(easing) {
    return easing;
  },
  out: function out(easing) {
    return function (t) {
      return 1 - easing(1 - t);
    };
  },
  inOut: function inOut(easing) {
    return function (t) {
      if (t < 0.5) {
        return easing(t * 2) / 2;
      }
      return 1 - easing((1 - t) * 2) / 2;
    };
  }
};
var _default = Easing;
exports.default = _default;