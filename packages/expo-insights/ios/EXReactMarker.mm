#import <ExpoInsights/EXReactMarker.h>

@implementation EXReactMarker

+ (NSDate *)getAppStartupEndTime
{
  return [self getDateFromMediaTime:StartupLogger::getInstance().getAppStartupEndTime()];
}

+ (NSDate *)getRunJSBundleStartTime
{
  return [self getDateFromMediaTime:StartupLogger::getInstance().getRunJSBundleStartTime()];
}

+ (NSDate *)getRunJSBundleEndTime
{
  // React Native logs `APP_STARTUP_STOP` right after bundle evaluation, so it stands in for the
  // bundle end time.
  return [self getDateFromMediaTime:StartupLogger::getInstance().getAppStartupEndTime()];
}

+ (NSDate *)getDateFromMediaTime:(double)mediaTime
{
  NSDate *now = [NSDate now];
  return [now dateByAddingTimeInterval:(mediaTime / 1000 - CACurrentMediaTime())];
}

@end
