/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */
'use strict';

export type PackagerAsset = {
  +__packager_asset: boolean,
  +fileSystemLocation: string,
  +httpServerLocation: string,
  +width: ?number,
  +height: ?number,
  +scales: Array<number>,
  +hash: string,
  +name: string,
  +type: string,
};

const assets: Array<PackagerAsset> = [];

export default {
  registerAsset(asset: PackagerAsset): number {
    return assets.push(asset);
  },
  getAssetByID(assetId: number): PackagerAsset {
    return assets[assetId - 1];
  },
};
