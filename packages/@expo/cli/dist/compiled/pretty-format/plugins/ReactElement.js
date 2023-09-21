'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.test = exports.serialize = exports.default = void 0;
var ReactIs = _interopRequireWildcard(require('react-is'));
var _markup = require('./lib/markup');
function _getRequireWildcardCache(nodeInterop) {
  if (typeof WeakMap !== 'function') return null;
  var cacheBabelInterop = new WeakMap();
  var cacheNodeInterop = new WeakMap();
  return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) {
    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
  })(nodeInterop);
}
function _interopRequireWildcard(obj, nodeInterop) {
  if (!nodeInterop && obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || typeof obj !== 'object' && typeof obj !== 'function') {
    return {
      default: obj
    };
  }
  var cache = _getRequireWildcardCache(nodeInterop);
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (key !== 'default' && Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}
var getChildren = function getChildren(arg) {
  var children = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  if (Array.isArray(arg)) {
    arg.forEach(function (item) {
      getChildren(item, children);
    });
  } else if (arg != null && arg !== false) {
    children.push(arg);
  }
  return children;
};
var getType = function getType(element) {
  var type = element.type;
  if (typeof type === 'string') {
    return type;
  }
  if (typeof type === 'function') {
    return type.displayName || type.name || 'Unknown';
  }
  if (ReactIs.isFragment(element)) {
    return 'React.Fragment';
  }
  if (ReactIs.isSuspense(element)) {
    return 'React.Suspense';
  }
  if (typeof type === 'object' && type !== null) {
    if (ReactIs.isContextProvider(element)) {
      return 'Context.Provider';
    }
    if (ReactIs.isContextConsumer(element)) {
      return 'Context.Consumer';
    }
    if (ReactIs.isForwardRef(element)) {
      if (type.displayName) {
        return type.displayName;
      }
      var functionName = type.render.displayName || type.render.name || '';
      return functionName !== '' ? `ForwardRef(${functionName})` : 'ForwardRef';
    }
    if (ReactIs.isMemo(element)) {
      var _functionName = type.displayName || type.type.displayName || type.type.name || '';
      return _functionName !== '' ? `Memo(${_functionName})` : 'Memo';
    }
  }
  return 'UNDEFINED';
};
var getPropKeys = function getPropKeys(element) {
  var props = element.props;
  return Object.keys(props).filter(function (key) {
    return key !== 'children' && props[key] !== undefined;
  }).sort();
};
var serialize = function serialize(element, config, indentation, depth, refs, printer) {
  return ++depth > config.maxDepth ? (0, _markup.printElementAsLeaf)(getType(element), config) : (0, _markup.printElement)(getType(element), (0, _markup.printProps)(getPropKeys(element), element.props, config, indentation + config.indent, depth, refs, printer), (0, _markup.printChildren)(getChildren(element.props.children), config, indentation + config.indent, depth, refs, printer), config, indentation);
};
exports.serialize = serialize;
var test = function test(val) {
  return val != null && ReactIs.isElement(val);
};
exports.test = test;
var plugin = {
  serialize: serialize,
  test: test
};
var _default = plugin;
exports.default = _default;