'use strict';

var start = Date.now();
require('./setUpGlobals');
require('./setUpDOM');
require('./setUpPerformance');
require('./setUpErrorHandling');
require('./polyfillPromise');
require('./setUpRegeneratorRuntime');
require('./setUpTimers');
require('./setUpXHR');
require('./setUpAlert');
require('./setUpNavigator');
require('./setUpBatchedBridge');
require('./setUpSegmentFetcher');
if (__DEV__) {
  require('./checkNativeVersion');
  require('./setUpDeveloperTools');
  require('../LogBox/LogBox').default.install();
}
require('../ReactNative/AppRegistry');
var GlobalPerformanceLogger = require('../Utilities/GlobalPerformanceLogger');
GlobalPerformanceLogger.markPoint('initializeCore_start', GlobalPerformanceLogger.currentTimestamp() - (Date.now() - start));
GlobalPerformanceLogger.markPoint('initializeCore_end');