/**
 * @providesModule ConsoleActions
 */
'use strict';

import Flux from 'Flux';

export default Flux.createActions({
  clearConsole() {
    return {};
  },

  logUncaughtError(id, message, stack, fatal, browserTaskUrl = null) {
    return {
      id,
      time: new Date(),
      message: [message],
      stack,
      fatal,
      url: browserTaskUrl,
    };
  },
});
