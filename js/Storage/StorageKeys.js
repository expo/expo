/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule StorageKeys
 */
'use strict';

/**
  * DEPRECATION WARNING
  *
  * This file is deprecated and should be migrated to LocalStorage.js, and
  * we should export functions to get/set/clear the data rather than the keys
  *
  */

import mapValues from 'lodash/mapValues';

const NAMESPACE = 'Exponent';

export default mapValues({
  History: 'history',
  NuxIsFinished: 'nuxIsFinishedOct-10-2016',
}, value => `${NAMESPACE}.${value}`);
