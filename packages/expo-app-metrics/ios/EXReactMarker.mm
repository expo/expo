#import <ExpoAppMetrics/EXReactMarker.h>

@implementation EXAppMetricsReactMarker

+ (double)getAppStartupStartTime
{
  return StartupLogger::getInstance().getAppStartupStartTime();
}

+ (double)getAppStartupEndTime
{
  return StartupLogger::getInstance().getAppStartupEndTime();
}

+ (double)getRunJSBundleStartTime
{
  return StartupLogger::getInstance().getRunJSBundleStartTime();
}

+ (double)getRunJSBundleEndTime
{
  // TODO(@tsapeta): React Native 0.87 removed `StartupLogger::getRunJSBundleEndTime()` — the end
  // time is still recorded internally on `RUN_JS_BUNDLE_STOP` but no longer publicly exposed.
  // Restore the real value once react-native provides an accessor again.
  return NAN;
}

@end
