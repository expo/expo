import {
  PermissionResponse,
  PermissionStatus,
  PermissionHookOptions,
  createPermissionHook,
  UnavailabilityError,
} from 'expo-modules-core';
import * as React from 'react';
import { Platform, ViewProps } from 'react-native';

import ExpoBarCodeScannerModule from './ExpoBarCodeScannerModule';
import ExpoBarCodeScannerView from './ExpoBarCodeScannerView';

const { BarCodeType, Type } = ExpoBarCodeScannerModule;

const EVENT_THROTTLE_MS = 500;

// @needsAudit
/**
 * Those coordinates are represented in the coordinate space of the barcode source (e.g. when you
 * are using the barcode scanner view, these values are adjusted to the dimensions of the view).
 */
export type BarCodePoint = {
  /**
   * The `x` coordinate value.
   */
  x: number;
  /**
   * The `y` coordinate value.
   */
  y: number;
};

// @needsAudit
export type BarCodeSize = {
  /**
   * The height value.
   */
  height: number;
  /**
   * The width value.
   */
  width: number;
};

// @needsAudit
export type BarCodeBounds = {
  /**
   * The origin point of the bounding box.
   */
  origin: BarCodePoint;
  /**
   * The size of the bounding box.
   */
  size: BarCodeSize;
};

// @needsAudit
export type BarCodeScannerResult = {
  /**
   * The barcode type.
   */
  type: string;
  /**
   * The information encoded in the bar code.
   */
  data: string;
  /**
   * The [BarCodeBounds](#barcodebounds) object.
   * `bounds` in some case will be representing an empty rectangle.
   * Moreover, `bounds` doesn't have to bound the whole barcode.
   * For some types, they will represent the area used by the scanner.
   */
  bounds: BarCodeBounds;
  /**
   * Corner points of the bounding box.
   * `cornerPoints` is not always available and may be empty. On iOS, for `code39` and `pdf417`
   * you don't get this value.
   */
  cornerPoints: BarCodePoint[];
};

// @docsMissing
export type BarCodeEvent = BarCodeScannerResult & {
  target?: number;
};

// @docsMissing
export type BarCodeEventCallbackArguments = {
  nativeEvent: BarCodeEvent;
};

// @docsMissing
export type BarCodeScannedCallback = (params: BarCodeEvent) => void;

// @needsAudit
export type BarCodeScannerProps = ViewProps & {
  /**
   * Camera facing. Use one of `BarCodeScanner.Constants.Type`. Use either `Type.front` or `Type.back`.
   * Same as `Camera.Constants.Type`.
   * @default Type.back
   */
  type?: 'front' | 'back' | number;
  /**
   * An array of bar code types. Usage: `BarCodeScanner.Constants.BarCodeType.<codeType>` where
   * `codeType` is one of these [listed above](#supported-formats). Defaults to all supported bar
   * code types. It is recommended to provide only the bar code formats you expect to scan to
   * minimize battery usage.
   *
   * For example: `barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}`.
   */
  barCodeTypes?: string[];
  /**
   * A callback that is invoked when a bar code has been successfully scanned. The callback is
   * provided with an [BarCodeScannerResult](#barcodescannerresult).
   * > __Note:__ Passing `undefined` to the `onBarCodeScanned` prop will result in no scanning. This
   * > can be used to effectively "pause" the scanner so that it doesn't continually scan even after
   * > data has been retrieved.
   */
  onBarCodeScanned?: BarCodeScannedCallback;
};

export class BarCodeScanner extends React.Component<BarCodeScannerProps> {
  lastEvents: { [key: string]: any } = {};
  lastEventsTimes: { [key: string]: any } = {};

  static Constants = {
    BarCodeType,
    Type,
  };

  static ConversionTables = {
    type: Type,
  };

  static defaultProps = {
    type: Type.back,
    barCodeTypes: Object.values(BarCodeType),
  };

  // @needsAudit
  /**
   * Checks user's permissions for accessing the camera.
   * @return Return a promise that fulfills to an object of type [`PermissionResponse`](#permissionresponse).
   */
  static async getPermissionsAsync(): Promise<PermissionResponse> {
    return ExpoBarCodeScannerModule.getPermissionsAsync();
  }

  // @needsAudit
  /**
   * Asks the user to grant permissions for accessing the camera.
   *
   * On iOS this will require apps to specify the `NSCameraUsageDescription` entry in the `Info.plist`.
   * @return Return a promise that fulfills to an object of type [`PermissionResponse`](#permissionresponse).
   */
  static async requestPermissionsAsync(): Promise<PermissionResponse> {
    return ExpoBarCodeScannerModule.requestPermissionsAsync();
  }

  // @needsAudit
  /**
   * Check or request permissions for the barcode scanner.
   * This uses both `requestPermissionAsync` and `getPermissionsAsync` to interact with the permissions.
   *
   * @example
   * ```ts
   * const [permissionResponse, requestPermission] = BarCodeScanner.usePermissions();
   * ```
   */
  static usePermissions = createPermissionHook({
    getMethod: BarCodeScanner.getPermissionsAsync,
    requestMethod: BarCodeScanner.requestPermissionsAsync,
  });

  // @needsAudit
  /**
   * Scan bar codes from the image given by the URL.
   * @param url URL to get the image from.
   * @param barCodeTypes An array of bar code types. Defaults to all supported bar code types on
   * the platform.
   * > __Note:__ Only QR codes are supported on iOS.
   * @return A possibly empty array of objects of the `BarCodeScannerResult` shape, where the type
   * refers to the bar code type that was scanned and the data is the information encoded in the bar
   * code.
   */
  static async scanFromURLAsync(
    url: string,
    barCodeTypes: string[] = Object.values(BarCodeType)
  ): Promise<BarCodeScannerResult[]> {
    if (!ExpoBarCodeScannerModule.scanFromURLAsync) {
      throw new UnavailabilityError('expo-barcode-scanner', 'scanFromURLAsync');
    }
    if (Array.isArray(barCodeTypes) && !barCodeTypes.length) {
      throw new Error('No barCodeTypes specified; provide at least one barCodeType for scanner');
    }

    if (Platform.OS === 'ios') {
      if (Array.isArray(barCodeTypes) && !barCodeTypes.includes(BarCodeType.qr)) {
        // Only QR type is supported on iOS, fail if one tries to use other types
        throw new Error('Only QR type is supported by scanFromURLAsync() on iOS');
      }
      // on iOS use only supported QR type
      return await ExpoBarCodeScannerModule.scanFromURLAsync(url, [BarCodeType.qr]);
    }

    // On other platforms, if barCodeTypes is not provided, use all available types
    return await ExpoBarCodeScannerModule.scanFromURLAsync(url, barCodeTypes);
  }

  render() {
    const nativeProps = this.convertNativeProps(this.props);
    const { onBarCodeScanned } = this.props;
    return (
      <ExpoBarCodeScannerView
        {...nativeProps}
        onBarCodeScanned={this.onObjectDetected(onBarCodeScanned)}
      />
    );
  }

  /**
   * @hidden
   */
  onObjectDetected =
    (callback?: BarCodeScannedCallback) =>
    ({ nativeEvent }: BarCodeEventCallbackArguments) => {
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

  /**
   * @hidden
   */
  convertNativeProps(props: BarCodeScannerProps) {
    const nativeProps: BarCodeScannerProps = {};

    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'string' && BarCodeScanner.ConversionTables[key]) {
        nativeProps[key] = BarCodeScanner.ConversionTables[key][value];
      } else {
        nativeProps[key] = value;
      }
    }

    return nativeProps;
  }
}

export { PermissionResponse, PermissionStatus, PermissionHookOptions };
export const { Constants, getPermissionsAsync, requestPermissionsAsync, scanFromURLAsync } =
  BarCodeScanner;
