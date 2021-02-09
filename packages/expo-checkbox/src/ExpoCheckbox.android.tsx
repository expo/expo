import React from 'react';

import { CheckboxComponent, CheckboxProps } from './Checkbox.types';
import CheckboxUnavailable from './CheckboxUnavailable';

function maybeRequireNativeCheckbox() {
  try {
    // Temporary for SDK 40 until we make our own native implementation
    return require('react-native/Libraries/Components/CheckBox/CheckBox');
  } catch (error) {
    return null;
  }
}

/**
 * Because of a bug, the `tintColors` property is only using `tintColors.true`.
 * This API is a bit buggy, so let's remove that and only use `colors` which is passed as `tintColors.true`.
 *
 * @see https://github.com/facebook/react-native/blob/v0.63.4/Libraries/Components/Checkbox/Checkbox.android.js#L163
 */
function resolveTintColors(color: CheckboxProps['color']) {
  return color ? { true: color } : undefined;
}

// React Native 0.64+ doesn't have the Checkbox component
const NativeCheckbox = maybeRequireNativeCheckbox();

const ExpoCheckbox: CheckboxComponent = props => {
  const { color, ...other } = props;
  const Checkbox = NativeCheckbox || CheckboxUnavailable;
  return <Checkbox {...other} tintColors={resolveTintColors(color)} />;
};

ExpoCheckbox.isAvailableAsync = async () => !!NativeCheckbox;

export default ExpoCheckbox;
