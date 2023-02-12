'use strict';

import { Asset } from 'expo-asset';
import { BarCodeScanner } from 'expo-barcode-scanner';
import React from 'react';
import { Platform } from 'react-native';

import * as TestUtils from '../TestUtils';
import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';

export const name = 'BarCodeScanner';
const style = { width: 200, height: 200 };

export async function test(t, { setPortalChild, cleanupPortal }) {
  const shouldSkipTestsRequiringPermissions =
    await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  const testPoint = (value, expected, inaccuracy) => {
    t.expect(value).toBeGreaterThanOrEqual(expected - inaccuracy);
    t.expect(value).toBeLessThan(expected + inaccuracy);
  };

  const testBarCodeBounds = (bounds, expectedBounds, sizeInaccuracy, originInaccuracy) => {
    t.expect(bounds).toBeDefined();
    t.expect(typeof bounds.origin).toBe('object');
    t.expect(typeof bounds.origin.x).toBe('number');
    t.expect(typeof bounds.origin.y).toBe('number');
    t.expect(typeof bounds.size).toBe('object');
    t.expect(typeof bounds.size.width).toBe('number');
    t.expect(typeof bounds.size.height).toBe('number');

    testPoint(bounds.origin.x, expectedBounds.origin.x, originInaccuracy);
    testPoint(bounds.origin.y, expectedBounds.origin.y, originInaccuracy);

    testPoint(bounds.size.width, expectedBounds.size.width, sizeInaccuracy);
    testPoint(bounds.size.height, expectedBounds.size.height, sizeInaccuracy);
  };

  describeWithPermissions('BarCodeScanner', () => {
    const mountAndWaitFor = (child, propName = 'ref') =>
      new Promise((resolve) => {
        const response = originalMountAndWaitFor(child, propName, setPortalChild);
        setTimeout(() => resolve(response), 1500);
      });

    t.beforeAll(async () => {
      await TestUtils.acceptPermissionsAndRunCommandAsync(() => {
        return BarCodeScanner.requestPermissionsAsync();
      });
    });

    t.beforeEach(async () => {
      const { status } = await BarCodeScanner.getPermissionsAsync();
      t.expect(status).toEqual('granted');
    });

    t.afterEach(async () => {
      await cleanupPortal();
    });

    t.describe('when created', () => {
      t.it('displays the view', async () => {
        await mountAndWaitFor(<BarCodeScanner style={style} />);
      });
    });

    t.describe('scanFromURLAsync', () => {
      t.it('returns empty result when there is no barcode', async () => {
        const asset = await Asset.fromModule(require('../assets/black-128x256.png'));
        const result = await BarCodeScanner.scanFromURLAsync(asset.uri);

        t.expect(result).toBeDefined();
        t.expect(result.length).toEqual(0);
      });

      t.it('scans a QR code from asset', async () => {
        const asset = await Asset.fromModule(require('../assets/qrcode_expo.jpg'));
        const result = await BarCodeScanner.scanFromURLAsync(asset.uri);

        t.expect(result).toBeDefined();
        t.expect(result.length).toEqual(1);
        t.expect(result[0]).toBeDefined();
        t.expect(result[0].type).toEqual(BarCodeScanner.Constants.BarCodeType.qr);
        t.expect(result[0].data).toEqual('https://expo.io/');
        testBarCodeBounds(
          result[0].bounds,
          {
            origin: {
              x: 40,
              y: 40,
            },
            size: {
              width: 210,
              height: 210,
            },
          },
          2,
          2
        );
        t.expect(result[0].cornerPoints).toBeDefined();
        t.expect(result[0].cornerPoints.length).toEqual(4);
      });

      t.it('scans a QR code from photo asset', async () => {
        // Public domain photo from https://commons.wikimedia.org/wiki/File:QR_Code_Damaged.jpg
        const asset = await Asset.fromModule(require('../assets/qrcode_photo_wikipedia.jpg'));
        const result = await BarCodeScanner.scanFromURLAsync(asset.uri);

        t.expect(result).toBeDefined();
        t.expect(result.length).toEqual(1);
        t.expect(result[0]).toBeDefined();
        t.expect(result[0].type).toEqual(BarCodeScanner.Constants.BarCodeType.qr);
        t.expect(result[0].data).toEqual('http://en.m.wikipedia.org');
        testBarCodeBounds(
          result[0].bounds,
          {
            origin: {
              x: 94,
              y: 94,
            },
            size: {
              width: 294,
              height: 296,
            },
          },
          10,
          10
        );
        t.expect(result[0].cornerPoints).toBeDefined();
        t.expect(result[0].cornerPoints.length).toEqual(4);
      });

      t.it('scans a QR code from base64 URL', async () => {
        const url =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyAQMAAAAk8RryAAAABlBMVEX/' +
          '//8AAABVwtN+AAAAcElEQVQY04XFMQrAMAgFUCGr4FUCXQO9uuAq/KsEugq2m2bqWx79kQRn1EzGyu' +
          '1whx/Pc+gxKSnXku4ZNdFQolq2m3jN9/SrD0Ws9l4Ysx5uj9QftqstqQatmey2ftjW6GPI7PvD2iYE' +
          'uJbEmlT/eAEXiXvHFX7hfQAAAABJRU5ErkJggg==';
        const result = await BarCodeScanner.scanFromURLAsync(url);

        t.expect(result).toBeDefined();
        t.expect(result.length).toEqual(1);
        t.expect(result[0]).toBeDefined();
        t.expect(result[0].type).toEqual(BarCodeScanner.Constants.BarCodeType.qr);
        t.expect(result[0].data).toEqual('test');
      });

      if (Platform.OS === 'android') {
        t.it('scans a Data Matrix code from asset', async () => {
          const asset = await Asset.fromModule(require('../assets/datamatrix_expo.png'));
          const result = await BarCodeScanner.scanFromURLAsync(asset.uri);

          t.expect(result).toBeDefined();
          t.expect(result.length).toEqual(1);
          t.expect(result[0]).toBeDefined();
          t.expect(result[0].type).toEqual(BarCodeScanner.Constants.BarCodeType.datamatrix);
          t.expect(result[0].data).toEqual('https://expo.io/');
          testBarCodeBounds(
            result[0].bounds,
            {
              origin: {
                x: 7,
                y: 7,
              },
              size: {
                width: 141,
                height: 141,
              },
            },
            2,
            2
          );
          t.expect(result[0].cornerPoints).toBeDefined();
          t.expect(result[0].cornerPoints.length).toEqual(4);
        });
      }

      t.it('respects barCodeTypes parameter', async () => {
        const asset = await Asset.fromModule(require('../assets/datamatrix_expo.png'));
        const result = await BarCodeScanner.scanFromURLAsync(asset.uri, [
          BarCodeScanner.Constants.BarCodeType.qr,
        ]);

        t.expect(result).toBeDefined();
        t.expect(result.length).toEqual(0);
      });

      t.it('works with multiple codes', async () => {
        const asset = await Asset.fromModule(require('../assets/multiple_codes.png'));
        const result = await BarCodeScanner.scanFromURLAsync(asset.uri);

        t.expect(result).toBeDefined();
        t.expect(result.length > 0).toBe(true);
      });
    });
  });
}
