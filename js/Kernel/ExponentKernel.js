/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExponentKernel
 * @flow
 */
'use strict';

import { NativeModules } from 'react-native';

const { ExponentConstants } = NativeModules;

let ExponentKernel;

if (NativeModules.ExponentKernel) {
  ExponentKernel = NativeModules.ExponentKernel;
} else {
  const log = (msg, ...rest) => {
    console.log(`ExponentKernel: ${msg}, Arguments: ${JSON.stringify(rest)}`);
  };

  ExponentKernel = {
    routeDidForeground: log.bind(null, 'routeDidForeground'),
    onLoaded: log.bind(null, 'onLoaded'),
    openURL: log.bind(null, 'openURL'),
    onEventSuccess: log.bind(null, 'onEventSuccess'),
    onEventFailure: log.bind(null, 'onEventFailure'),
    clearExperienceData: log.bind(null, 'clearExperienceData'),
    dismissNuxAsync: log.bind(null, 'dismissNuxAsync'),
    getManifestAsync: async () => {
      let manifest;
      if (ExponentConstants && ExponentConstants.manifest) {
        manifest = ExponentConstants.manifest;
        if (typeof manifest === 'string') {
          manifest = JSON.parse(manifest);
        }
      }

      manifest = {
        ...manifest,
        id: '@anonymous/exponent-home',
      };

      return JSON.stringify(manifest);
    },
    sdkVersions: ['UNVERSIONED'],
    __isFake: true,
  };
}

export default ExponentKernel;
