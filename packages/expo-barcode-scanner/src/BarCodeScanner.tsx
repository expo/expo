import { UnavailabilityError } from 'expo-errors';
import mapValues from 'lodash.mapvalues';
import PropTypes from 'prop-types';
import React from 'react';
import { findNodeHandle, Platform, ViewProps, ViewPropTypes } from 'react-native';

import ExpoBarCodeScannerModule from './ExpoBarCodeScannerModule';
import ExpoBarCodeScannerView from './ExpoBarCodeScannerView';

const { BarCodeType, Type } = ExpoBarCodeScannerModule;

const EVENT_THROTTLE_MS = 500;

type BarCodeEvent = {
  type: string;
  data: string;
  [key: string]: any;
};

export type BarCodeEventCallbackArguments = {
  nativeEvent: BarCodeEvent;
};

export type BarCodeReadCallback = (params: BarCodeEvent) => void;

export type BarCodeScannedCallback = (params: BarCodeEventCallbackArguments) => void;

export interface BarCodeScannerProps extends ViewProps {
  type?: 'front' | 'back' | number;
  torchMode?: 'on' | 'off';
  barCodeTypes?: string[];
  onBarCodeRead?: BarCodeReadCallback;
  onBarCodeScanned: BarCodeScannedCallback;
}

type AnyComponent = null | React.Component<any, any> | React.ComponentClass<any>;

export class BarCodeScanner extends React.Component<BarCodeScannerProps> {
  lastEvents: { [key: string]: any } = {};
  lastEventsTimes: { [key: string]: any } = {};
  barCodeScannerRef: AnyComponent = null;
  barCodeScannerHandle: null | number = null;

  static Constants = {
    BarCodeType,
    Type,
  };

  static ConversionTables = {
    type: Type,
  };

  static propTypes = {
    ...ViewPropTypes,
    onBarCodeScanned: PropTypes.func,
    barCodeTypes: PropTypes.array,
    type: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

  static defaultProps = {
    type: Type.back,
    barCodeTypes: Object.values(BarCodeType),
  };

  static async scanFromURLAsync(
    url: string,
    barCodeTypes: string[]
  ): Promise<{ type: string; data: string }> {
    if (!ExpoBarCodeScannerModule.scanFromURLAsync) {
      throw new UnavailabilityError('expo-barcode-scanner', 'scanFromURLAsync');
    }
    if (Array.isArray(barCodeTypes) && !barCodeTypes.length) {
      throw new Error('No barCodeTypes requested, provide at least one barCodeType for scanner');
    }

    if (Platform.OS === 'ios') {
      if (Array.isArray(barCodeTypes) && !barCodeTypes.includes(BarCodeType.qr)) {
        // Only QR type is supported on iOS, fail if one tries to use other types
        throw new Error('Only QR type is supported by scanFromURLAsync() on iOS');
      }
      // on iOS use only supported QR type
      return await ExpoBarCodeScannerModule.scanFromURLAsync(url, [BarCodeType.qr]);
    }

    // on Android if barCodeTypes not provided use all available types
    const effectiveBarCodeTypes = barCodeTypes || Object.values(BarCodeType);
    return await ExpoBarCodeScannerModule.scanFromURLAsync(url, effectiveBarCodeTypes);
  }

  render() {
    const nativeProps = this.convertNativeProps(this.props);
    const { onBarCodeScanned, onBarCodeRead } = this.props;
    return (
      <ExpoBarCodeScannerView
        {...nativeProps}
        ref={this.setReference}
        onBarCodeScanned={this.onObjectDetected(onBarCodeScanned || onBarCodeRead)} // onBarCodeRead is deprecated
      />
    );
  }

  setReference = (ref: AnyComponent) => {
    if (ref) {
      this.barCodeScannerRef = ref;
      this.barCodeScannerHandle = findNodeHandle(ref);
    } else {
      this.barCodeScannerRef = null;
      this.barCodeScannerHandle = null;
    }
  };

  onObjectDetected = (callback?: (params: any) => void) => ({
    nativeEvent,
  }: BarCodeEventCallbackArguments) => {
    const { type } = nativeEvent;
    if (
      this.lastEvents[type] &&
      this.lastEventsTimes[type] &&
      JSON.stringify(nativeEvent) === this.lastEvents[type] &&
      Date.now() - this.lastEventsTimes[type] < EVENT_THROTTLE_MS
    ) {
      return;
    }

    if (callback) {
      callback(nativeEvent);
      this.lastEventsTimes[type] = new Date();
      this.lastEvents[type] = JSON.stringify(nativeEvent);
    }
  };

  convertNativeProps(props: BarCodeScannerProps) {
    const newProps = mapValues(props, this.convertProp);
    return newProps;
  }

  convertProp(value: any, key: string): any {
    if (typeof value === 'string' && BarCodeScanner.ConversionTables[key]) {
      return BarCodeScanner.ConversionTables[key][value];
    }
    return value;
  }
}

export const { Constants } = BarCodeScanner;
