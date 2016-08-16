/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule Browser
 */
'use strict';

import { EventEmitter } from 'fbemitter';

let emitter = new EventEmitter();

let Browser = {
  refresh() {
    emitter.emit('refresh');
  },

  addRefreshListener(listener) {
    return emitter.addListener('refresh', listener);
  },
};

export default Browser;
