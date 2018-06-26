// @flow

import { NativeModulesProxy } from 'expo-core';

// On Android we pass the manifest in JSON form so this step is necessary
const { ExponentConstants } = NativeModulesProxy;

let manifest = null;
if (ExponentConstants && ExponentConstants.manifest) {
  manifest = ExponentConstants.manifest;
  if (typeof manifest === 'string') {
    manifest = JSON.parse(manifest);
  }
}

export default {
  ...ExponentConstants,
  linkingUrl: ExponentConstants.linkingUri,
  manifest,
};
