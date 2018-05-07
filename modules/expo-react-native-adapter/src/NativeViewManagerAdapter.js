import React from 'react';
import omit from 'lodash.omit';
import pick from 'lodash.pick';
import PropTypes from 'prop-types';
import { requireNativeComponent, ViewPropTypes, UIManager } from 'react-native';

// We'd like to make the transition from react-native's
// requireNativeComponent to expo-core's requireNativeViewManager
// as easy as possible, so an obvious requirement will be to be able
// to just replace the requireNativeComponent with requireNativeViewManager
// call. If that's so, we have to wrap a native component in two middleware
// components - the bottom one, near the requireNativeComponent call has to
// define a propType for proxiedProperties (so that doesn't complain),
// and the "top" one has to accept all the properties, split them into
// props passed to react-native's View (like style, testID, etc.)
// and custom view properties. For that we use
// {omit,pick}(props, Object.keys(ViewPropTypes))

const ViewPropTypesKeys = Object.keys(ViewPropTypes);

const getViewManagerAdapterNameForViewName = name => `ViewManagerAdapter_${name}`;

const createNativeComponentClass = name => {
  class NativeComponent extends React.Component {
    static propTypes = { ...ViewPropTypes, proxiedProperties: PropTypes.object };
    render() {
      return <UnderlyingNativeComponent {...this.props} />;
    }
  }

  const nativeComponentName = getViewManagerAdapterNameForViewName(name);

  const UnderlyingNativeComponent = requireNativeComponent(nativeComponentName, NativeComponent, {
    nativeOnly: Object.keys(UIManager[nativeComponentName].NativeProps).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    ),
  });

  NativeComponent.displayName = name;
  return NativeComponent;
};

export const requireNativeViewManager = (name, component) => {
  const NativeComponent = createNativeComponentClass(name);
  const PropTypesKeys = [
    'children',
    ...ViewPropTypesKeys,
    ...Object.keys(UIManager[getViewManagerAdapterNameForViewName(name)].NativeProps),
    ...Object.keys(UIManager[getViewManagerAdapterNameForViewName(name)].directEventTypes),
  ];
  class NativeComponentWrapper extends React.Component {
    render() {
      const nativeProps = pick(this.props, PropTypesKeys);
      const proxiedProps = omit(this.props, PropTypesKeys);
      return <NativeComponent proxiedProperties={proxiedProps} {...nativeProps} />;
    }
  }
  NativeComponentWrapper.displayName = `ViewWrapper<${name}>`;
  return NativeComponentWrapper;
};
