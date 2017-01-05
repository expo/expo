/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule StorageKeys
 */
'use strict';

import mapValues from 'lodash/mapValues';

const NAMESPACE = 'Exponent';

export default mapValues({
  History: 'history',
  NuxIsFinished: 'nuxIsFinishedOct-10-2016',
}, value => `${NAMESPACE}.${value}`);
