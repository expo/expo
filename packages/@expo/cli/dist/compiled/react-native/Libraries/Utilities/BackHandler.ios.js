'use strict';

module.exports = require('../Components/UnimplementedViews/UnimplementedView');
function emptyFunction() {}
var BackHandler = {
  exitApp: emptyFunction,
  addEventListener: function addEventListener(_eventName, _handler) {
    return {
      remove: emptyFunction
    };
  },
  removeEventListener: function removeEventListener(_eventName, _handler) {}
};
module.exports = BackHandler;
//# sourceMappingURL=BackHandler.ios.js.map