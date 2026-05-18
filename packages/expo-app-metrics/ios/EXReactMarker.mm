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
  return StartupLogger::getInstance().getRunJSBundleEndTime();
}

+ (double)getInitReactRuntimeStartTime
{
  return StartupLogger::getInstance().getInitReactRuntimeStartTime();
}

+ (double)getInitReactRuntimeEndTime
{
  return StartupLogger::getInstance().getInitReactRuntimeEndTime();
}

@end
