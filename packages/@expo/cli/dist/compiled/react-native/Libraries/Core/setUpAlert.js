'use strict';
if (!global.alert) {
  global.alert = function (text) {
    require("../Alert/Alert").alert('Alert', '' + text);
  };
}
//# sourceMappingURL=setUpAlert.js.map