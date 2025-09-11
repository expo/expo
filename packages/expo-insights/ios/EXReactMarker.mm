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
  return [self getDateFromMediaTime:StartupLogger::getInstance().getRunJSBundleEndTime()];
}

+ (NSDate *)getDateFromMediaTime:(double)mediaTime
{
  NSDate *now = [NSDate now];
  return [now dateByAddingTimeInterval:(mediaTime / 1000 - CACurrentMediaTime())];
}

@end
