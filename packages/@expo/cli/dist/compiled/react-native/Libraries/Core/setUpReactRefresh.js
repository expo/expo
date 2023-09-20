'use strict';

if (__DEV__) {
  var DevSettings = require('../Utilities/DevSettings');
  if (typeof DevSettings.reload !== 'function') {
    throw new Error('Could not find the reload() implementation.');
  }
  var ReactRefreshRuntime = require('react-refresh/runtime');
  ReactRefreshRuntime.injectIntoGlobalHook(global);
  var Refresh = {
    performFullRefresh: function performFullRefresh(reason) {
      DevSettings.reload(reason);
    },
    createSignatureFunctionForTransform: ReactRefreshRuntime.createSignatureFunctionForTransform,
    isLikelyComponentType: ReactRefreshRuntime.isLikelyComponentType,
    getFamilyByType: ReactRefreshRuntime.getFamilyByType,
    register: ReactRefreshRuntime.register,
    performReactRefresh: function performReactRefresh() {
      if (ReactRefreshRuntime.hasUnrecoverableErrors()) {
        DevSettings.reload('Fast Refresh - Unrecoverable');
        return;
      }
      ReactRefreshRuntime.performReactRefresh();
      DevSettings.onFastRefresh();
    }
  };
  global[(global.__METRO_GLOBAL_PREFIX__ || '') + '__ReactRefresh'] = Refresh;
}
//# sourceMappingURL=setUpReactRefresh.js.map