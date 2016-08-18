/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule StorageKeys
 */
'use strict';

import mapValues from 'lodash/mapValues';

const NAMESPACE = 'Exponent';

export default mapValues({
  Email: 'email',
  History: 'history',
  SkipRegistration: 'skipRegistration',
}, value => `${NAMESPACE}.${value}`);
