'use strict';
var ExceptionsManager = require('./ExceptionsManager');
ExceptionsManager.installConsoleErrorReporter();
if (!global.__fbDisableExceptionsManager) {
  var handleError = function handleError(e, isFatal) {
    try {
      ExceptionsManager.handleException(e, isFatal);
    } catch (ee) {
      console.log('Failed to print error: ', ee.message);
      throw e;
    }
  };
  var ErrorUtils = require('../vendor/core/ErrorUtils');
  ErrorUtils.setGlobalHandler(handleError);
}