Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.byClickable = byClickable;
exports.byTestID = byTestID;
exports.byTextMatching = byTextMatching;
exports.enter = enter;
exports.expectNoConsoleError = expectNoConsoleError;
exports.expectNoConsoleWarn = expectNoConsoleWarn;
exports.expectRendersMatchingSnapshot = expectRendersMatchingSnapshot;
exports.maximumDepthError = maximumDepthError;
exports.maximumDepthOfJSON = maximumDepthOfJSON;
exports.renderAndEnforceStrictMode = renderAndEnforceStrictMode;
exports.renderWithStrictMode = renderWithStrictMode;
exports.scrollToBottom = scrollToBottom;
exports.tap = tap;
exports.withMessage = withMessage;
var _jsxRuntime = require("react/jsx-runtime");
var Switch = require('../Components/Switch/Switch').default;
var TextInput = require('../Components/TextInput/TextInput');
var View = require('../Components/View/View');
var Text = require('../Text/Text');
var _require = require('@react-native/virtualized-lists'),
  VirtualizedList = _require.VirtualizedList;
var React = require('react');
var ShallowRenderer = require('react-shallow-renderer');
var ReactTestRenderer = require('react-test-renderer');
var shallowRenderer = new ShallowRenderer();
function byClickable() {
  return withMessage(function (node) {
    var _node$props, _node$props$onStartSh, _node$instance, _node$instance$state;
    return node.type === Text && node.props && typeof node.props.onPress === 'function' || node.type === Switch && node.props && node.props.disabled !== true || node.type === View && (node == null ? void 0 : (_node$props = node.props) == null ? void 0 : (_node$props$onStartSh = _node$props.onStartShouldSetResponder) == null ? void 0 : _node$props$onStartSh.testOnly_pressabilityConfig) || ((_node$instance = node.instance) == null ? void 0 : (_node$instance$state = _node$instance.state) == null ? void 0 : _node$instance$state.pressability) != null || node.instance != null && typeof node.instance.touchableHandlePress === 'function';
  }, 'is clickable');
}
function byTestID(testID) {
  return withMessage(function (node) {
    return node.props && node.props.testID === testID;
  }, `testID prop equals ${testID}`);
}
function byTextMatching(regex) {
  return withMessage(function (node) {
    return node.props != null && regex.exec(node.props.children) !== null;
  }, `text content matches ${regex.toString()}`);
}
function enter(instance, text) {
  var input = instance.findByType(TextInput);
  input.props.onChange && input.props.onChange({
    nativeEvent: {
      text: text
    }
  });
  input.props.onChangeText && input.props.onChangeText(text);
}
function maximumDepthError(tree, maxDepthLimit) {
  var maxDepth = maximumDepthOfJSON(tree.toJSON());
  if (maxDepth > maxDepthLimit) {
    return `maximumDepth of ${maxDepth} exceeded limit of ${maxDepthLimit} - this is a proxy ` + 'metric to protect against stack overflow errors:\n\n' + 'https://fburl.com/rn-view-stack-overflow.\n\n' + 'To fix, you need to remove native layers from your hierarchy, such as unnecessary View ' + 'wrappers.';
  } else {
    return null;
  }
}
function expectNoConsoleWarn() {
  jest.spyOn(console, 'warn').mockImplementation(function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    expect(args).toBeFalsy();
  });
}
function expectNoConsoleError() {
  var hasNotFailed = true;
  jest.spyOn(console, 'error').mockImplementation(function () {
    if (hasNotFailed) {
      hasNotFailed = false;
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      expect(args).toBeFalsy();
    }
  });
}
function expectRendersMatchingSnapshot(name, ComponentProvider, unmockComponent) {
  var instance;
  jest.resetAllMocks();
  instance = ReactTestRenderer.create((0, _jsxRuntime.jsx)(ComponentProvider, {}));
  expect(instance).toMatchSnapshot('should deep render when mocked (please verify output manually)');
  jest.resetAllMocks();
  unmockComponent();
  instance = shallowRenderer.render((0, _jsxRuntime.jsx)(ComponentProvider, {}));
  expect(instance).toMatchSnapshot(`should shallow render as <${name} /> when not mocked`);
  jest.resetAllMocks();
  instance = shallowRenderer.render((0, _jsxRuntime.jsx)(ComponentProvider, {}));
  expect(instance).toMatchSnapshot(`should shallow render as <${name} /> when mocked`);
  jest.resetAllMocks();
  unmockComponent();
  instance = ReactTestRenderer.create((0, _jsxRuntime.jsx)(ComponentProvider, {}));
  expect(instance).toMatchSnapshot('should deep render when not mocked (please verify output manually)');
}
function maximumDepthOfJSON(node) {
  if (node == null) {
    return 0;
  } else if (typeof node === 'string' || node.children == null) {
    return 1;
  } else {
    var maxDepth = 0;
    node.children.forEach(function (child) {
      maxDepth = Math.max(maximumDepthOfJSON(child) + 1, maxDepth);
    });
    return maxDepth;
  }
}
function renderAndEnforceStrictMode(element) {
  expectNoConsoleError();
  return renderWithStrictMode(element);
}
function renderWithStrictMode(element) {
  var WorkAroundBugWithStrictModeInTestRenderer = function WorkAroundBugWithStrictModeInTestRenderer(prps) {
    return prps.children;
  };
  var StrictMode = React.StrictMode;
  return ReactTestRenderer.create((0, _jsxRuntime.jsx)(WorkAroundBugWithStrictModeInTestRenderer, {
    children: (0, _jsxRuntime.jsx)(StrictMode, {
      children: element
    })
  }));
}
function tap(instance) {
  var _touchable$props2, _touchable$props2$onS;
  var touchable = instance.find(byClickable());
  if (touchable.type === Text && touchable.props && touchable.props.onPress) {
    touchable.props.onPress();
  } else if (touchable.type === Switch && touchable.props) {
    var value = !touchable.props.value;
    var _touchable$props = touchable.props,
      onChange = _touchable$props.onChange,
      onValueChange = _touchable$props.onValueChange;
    onChange && onChange({
      nativeEvent: {
        value: value
      }
    });
    onValueChange && onValueChange(value);
  } else if (touchable != null && (_touchable$props2 = touchable.props) != null && (_touchable$props2$onS = _touchable$props2.onStartShouldSetResponder) != null && _touchable$props2$onS.testOnly_pressabilityConfig) {
    var _touchable$props$onSt = touchable.props.onStartShouldSetResponder.testOnly_pressabilityConfig(),
      onPress = _touchable$props$onSt.onPress,
      disabled = _touchable$props$onSt.disabled;
    if (!disabled) {
      onPress({
        nativeEvent: {}
      });
    }
  } else {
    if (!touchable.props || !touchable.props.disabled) {
      touchable.props.onPress({
        nativeEvent: {}
      });
    }
  }
}
function scrollToBottom(instance) {
  var list = instance.findByType(VirtualizedList);
  list.props && list.props.onEndReached();
}
function withMessage(fn, message) {
  fn.toString = function () {
    return message;
  };
  return fn;
}