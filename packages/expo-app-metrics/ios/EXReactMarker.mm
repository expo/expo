#import <ExpoAppMetrics/EXReactMarker.h>

@implementation EXAppMetricsReactMarker

+ (double)getAppStartupEndTime
{
  return StartupLogger::getInstance().getAppStartupEndTime();
}

+ (double)getRunJSBundleStartTime
{
  return StartupLogger::getInstance().getRunJSBundleStartTime();
}

@end
