import React from 'react';
import PropTypes from 'prop-types';
import { NativeModules, requireNativeComponent, ViewPropTypes } from 'react-native';

const BarCodeScannerManager =
  NativeModules.ExponentBarCodeScannerManager || NativeModules.ExponentBarCodeScannerModule;

function convertNativeProps(props) {
  const newProps = { ...props };
  if (typeof props.torchMode === 'string') {
    newProps.torchMode = BarCodeScanner.Constants.TorchMode[props.torchMode];
  }

  if (typeof props.type === 'string') {
    newProps.type = BarCodeScanner.Constants.Type[props.type];
  }

  return newProps;
}

const EventThrottleMs = 500;

export default class BarCodeScanner extends React.Component {
  static Constants = {
    BarCodeType: BarCodeScannerManager.BarCodeType,
    Type: BarCodeScannerManager.Type,
    TorchMode: BarCodeScannerManager.TorchMode,
  };

  static propTypes = {
    ...ViewPropTypes,
    onBarCodeRead: PropTypes.func,
    barCodeTypes: PropTypes.array,
    torchMode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

  static defaultProps = {
    type: BarCodeScannerManager.Type.back,
    torchMode: BarCodeScannerManager.TorchMode.off,
    barCodeTypes: Object.values(BarCodeScannerManager.BarCodeType),
  };

  static readFromURL(url, barCodeTypes) {
    return BarCodeScannerManager.readBarCodeFromURL(url, barCodeTypes);
  }

  setNativeProps(props) {
    const nativeProps = convertNativeProps(props);
    this._component.setNativeProps(nativeProps);
  }

  render() {
    const nativeProps = convertNativeProps(this.props);

    return (
      <ExponentBarCodeScanner
        {...nativeProps}
        ref={this._setRef}
        onBarCodeRead={this._onBarCodeRead}
      />
    );
  }

  _setRef = component => {
    this._component = component;
  };

  _onBarCodeRead = ({ nativeEvent }) => {
    if (
      this._lastEvent &&
      JSON.stringify(nativeEvent) === this._lastEvent &&
      new Date() - this._lastEventTime < EventThrottleMs
    ) {
      return;
    }

    if (this.props.onBarCodeRead) {
      this.props.onBarCodeRead(nativeEvent);
      this._lastEvent = JSON.stringify(nativeEvent);
      this._lastEventTime = new Date();
    }
  };
}

export const Constants = BarCodeScanner.Constants;

const ExponentBarCodeScanner = requireNativeComponent('ExponentBarCodeScanner', BarCodeScanner, {
  nativeOnly: {
    onBarCodeRead: true,
  },
});
