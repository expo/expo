import React from 'react';
import {
  findNodeHandle as findNodeHandleRN,
  NativeModules,
  Touchable,
  Platform,
} from 'react-native';
import deepEqual from 'fbjs/lib/areEqual';
import RNGestureHandlerModule from './RNGestureHandlerModule';
import State from './State';

function findNodeHandle(node) {
  if (Platform.OS === 'web') return node;
  return findNodeHandleRN(node);
}

const { UIManager = {} } = NativeModules;

const customGHEventsConfig = {
  onGestureHandlerEvent: { registrationName: 'onGestureHandlerEvent' },
  onGestureHandlerStateChange: {
    registrationName: 'onGestureHandlerStateChange',
  },
};

// Add gesture specific events to genericDirectEventTypes object exported from UIManager
// native module.
// Once new event types are registered with react it is possible to dispatch these
// events to all kind of native views.
UIManager.genericDirectEventTypes = {
  ...UIManager.genericDirectEventTypes,
  ...customGHEventsConfig,
};
// In newer versions of RN the `genericDirectEventTypes` is located in the object
// returned by UIManager.getConstants(), we need to add it there as well to make
// it compatible with RN 61+
if (UIManager.getConstants) {
  UIManager.getConstants().genericDirectEventTypes = {
    ...UIManager.getConstants().genericDirectEventTypes,
    ...customGHEventsConfig,
  };
}

// Wrap JS responder calls and notify gesture handler manager
const {
  setJSResponder: oldSetJSResponder = () => {},
  clearJSResponder: oldClearJSResponder = () => {},
} = UIManager;
UIManager.setJSResponder = (tag, blockNativeResponder) => {
  RNGestureHandlerModule.handleSetJSResponder(tag, blockNativeResponder);
  oldSetJSResponder(tag, blockNativeResponder);
};
UIManager.clearJSResponder = () => {
  RNGestureHandlerModule.handleClearJSResponder();
  oldClearJSResponder();
};

let handlerTag = 1;
const handlerIDToTag = {};

function isConfigParam(param, name) {
  // param !== Object(param) returns false if `param` is a function
  // or an object and returns true if `param` is null
  return (
    param !== undefined &&
    (param !== Object(param) || !('__isNative' in param)) &&
    name !== 'onHandlerStateChange' &&
    name !== 'onGestureEvent'
  );
}

function filterConfig(props, validProps, defaults = {}) {
  const res = { ...defaults };
  Object.keys(validProps).forEach(key => {
    const value = props[key];
    if (isConfigParam(value, key)) {
      let value = props[key];
      if (key === 'simultaneousHandlers' || key === 'waitFor') {
        value = transformIntoHandlerTags(props[key]);
      } else if (key === 'hitSlop') {
        if (typeof value !== 'object') {
          value = { top: value, left: value, bottom: value, right: value };
        }
      }
      res[key] = value;
    }
  });
  return res;
}

function transformIntoHandlerTags(handlerIDs) {
  if (!Array.isArray(handlerIDs)) {
    handlerIDs = [handlerIDs];
  }

  if (Platform.OS === 'web') {
    return handlerIDs.map(({ current }) => current).filter(handle => handle);
  }
  // converts handler string IDs into their numeric tags
  return handlerIDs
    .map(
      handlerID =>
        handlerIDToTag[handlerID] ||
        (handlerID.current && handlerID.current._handlerTag) ||
        -1
    )
    .filter(handlerTag => handlerTag > 0);
}

function hasUnresolvedRefs(props) {
  const extract = refs => {
    if (!Array.isArray(refs)) {
      return refs && refs.current === null;
    }
    return refs.some(r => r && r.current === null);
  };
  return extract(props['simultaneousHandlers']) || extract(props['waitFor']);
}

const stateToPropMappings = {
  [State.BEGAN]: 'onBegan',
  [State.FAILED]: 'onFailed',
  [State.CANCELLED]: 'onCancelled',
  [State.ACTIVE]: 'onActivated',
  [State.END]: 'onEnded',
};

export default function createHandler(
  handlerName,
  propTypes = {},
  config = {},
  transformProps,
  customNativeProps = {}
) {
  class Handler extends React.Component {
    static displayName = handlerName;

    static propTypes = propTypes;

    constructor(props) {
      super(props);
      this._handlerTag = handlerTag++;
      this._config = {};
      if (props.id) {
        if (handlerIDToTag[props.id] !== undefined) {
          throw new Error(`Handler with ID "${props.id}" already registered`);
        }
        handlerIDToTag[props.id] = this._handlerTag;
      }
    }

    _onGestureHandlerEvent = event => {
      if (event.nativeEvent.handlerTag === this._handlerTag) {
        this.props.onGestureEvent && this.props.onGestureEvent(event);
      } else {
        this.props.onGestureHandlerEvent &&
          this.props.onGestureHandlerEvent(event);
      }
    };

    _onGestureHandlerStateChange = event => {
      if (event.nativeEvent.handlerTag === this._handlerTag) {
        this.props.onHandlerStateChange &&
          this.props.onHandlerStateChange(event);

        const stateEventName = stateToPropMappings[event.nativeEvent.state];
        if (typeof this.props[stateEventName] === 'function') {
          this.props[stateEventName](event);
        }
      } else {
        this.props.onGestureHandlerStateChange &&
          this.props.onGestureHandlerStateChange(event);
      }
    };

    _refHandler = node => {
      this._viewNode = node;

      const child = React.Children.only(this.props.children);
      const { ref } = child;
      if (ref !== null) {
        if (typeof ref === 'function') {
          ref(node);
        } else {
          ref.current = node;
        }
      }
    };

    _createGestureHandler = newConfig => {
      this._config = newConfig;

      RNGestureHandlerModule.createGestureHandler(
        handlerName,
        this._handlerTag,
        newConfig
      );
    };

    _attachGestureHandler = newViewTag => {
      this._viewTag = newViewTag;

      RNGestureHandlerModule.attachGestureHandler(this._handlerTag, newViewTag);
    };

    _updateGestureHandler = newConfig => {
      this._config = newConfig;

      RNGestureHandlerModule.updateGestureHandler(this._handlerTag, newConfig);
    };

    componentWillUnmount() {
      RNGestureHandlerModule.dropGestureHandler(this._handlerTag);
      if (this._updateEnqueued) {
        clearImmediate(this._updateEnqueued);
      }
      if (this.props.id) {
        delete handlerIDToTag[this.props.id];
      }
    }

    componentDidMount() {
      if (hasUnresolvedRefs(this.props)) {
        // If there are unresolved refs (e.g. ".current" has not yet been set)
        // passed as `simultaneousHandlers` or `waitFor`, we enqueue a call to
        // _update method that will try to update native handler props using
        // setImmediate. This makes it so _update function gets called after all
        // react components are mounted and we expect the missing ref object to
        // be resolved by then.
        this._updateEnqueued = setImmediate(() => {
          this._updateEnqueued = null;
          this._update();
        });
      }

      this._createGestureHandler(
        filterConfig(
          transformProps ? transformProps(this.props) : this.props,
          { ...this.constructor.propTypes, ...customNativeProps },
          config
        )
      );
      this._attachGestureHandler(findNodeHandle(this._viewNode));
    }

    componentDidUpdate() {
      const viewTag = findNodeHandle(this._viewNode);
      if (this._viewTag !== viewTag) {
        this._attachGestureHandler(viewTag);
      }
      this._update();
    }

    _update() {
      const newConfig = filterConfig(
        transformProps ? transformProps(this.props) : this.props,
        { ...this.constructor.propTypes, ...customNativeProps },
        config
      );
      if (!deepEqual(this._config, newConfig)) {
        this._updateGestureHandler(newConfig);
      }
    }

    setNativeProps(updates) {
      const mergedProps = { ...this.props, ...updates };
      const newConfig = filterConfig(
        transformProps ? transformProps(mergedProps) : mergedProps,
        { ...this.constructor.propTypes, ...customNativeProps },
        config
      );
      this._updateGestureHandler(newConfig);
    }

    render() {
      let gestureEventHandler = this._onGestureHandlerEvent;
      const { onGestureEvent, onGestureHandlerEvent } = this.props;
      if (onGestureEvent && typeof onGestureEvent !== 'function') {
        // If it's not a method it should be an native Animated.event
        // object. We set it directly as the handler for the view
        // In this case nested handlers are not going to be supported
        if (onGestureHandlerEvent) {
          throw new Error(
            'Nesting touch handlers with native animated driver is not supported yet'
          );
        }
        gestureEventHandler = this.props.onGestureEvent;
      } else {
        if (
          onGestureHandlerEvent &&
          typeof onGestureHandlerEvent !== 'function'
        ) {
          throw new Error(
            'Nesting touch handlers with native animated driver is not supported yet'
          );
        }
      }

      let gestureStateEventHandler = this._onGestureHandlerStateChange;
      const { onHandlerStateChange, onGestureHandlerStateChange } = this.props;
      if (onHandlerStateChange && typeof onHandlerStateChange !== 'function') {
        // If it's not a method it should be an native Animated.event
        // object. We set it directly as the handler for the view
        // In this case nested handlers are not going to be supported
        if (onGestureHandlerStateChange) {
          throw new Error(
            'Nesting touch handlers with native animated driver is not supported yet'
          );
        }
        gestureStateEventHandler = this.props.onHandlerStateChange;
      } else {
        if (
          onGestureHandlerStateChange &&
          typeof onGestureHandlerStateChange !== 'function'
        ) {
          throw new Error(
            'Nesting touch handlers with native animated driver is not supported yet'
          );
        }
      }

      const child = React.Children.only(this.props.children);
      let grandChildren = child.props.children;
      if (
        Touchable.TOUCH_TARGET_DEBUG &&
        child.type &&
        (child.type === 'RNGestureHandlerButton' ||
          child.type.name === 'View' ||
          child.type.displayName === 'View')
      ) {
        grandChildren = React.Children.toArray(grandChildren);
        grandChildren.push(
          Touchable.renderDebugView({
            color: 'mediumspringgreen',
            hitSlop: child.props.hitSlop,
          })
        );
      }
      return React.cloneElement(
        child,
        {
          ref: this._refHandler,
          collapsable: false,
          onGestureHandlerEvent: gestureEventHandler,
          onGestureHandlerStateChange: gestureStateEventHandler,
        },
        grandChildren
      );
    }
  }
  return Handler;
}
