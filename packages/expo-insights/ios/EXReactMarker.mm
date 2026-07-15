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

+ (nullable NSDate *)getRunJSBundleEndTime
{
  // TODO(@tsapeta): React Native 0.87 removed `StartupLogger::getRunJSBundleEndTime()`. The end
  // time is still recorded internally on `RUN_JS_BUNDLE_STOP`, but there is no longer a public
  // accessor. Restore the `RUN_JS_BUNDLE_END` event once react-native exposes it again.
  return nil;
}

+ (NSDate *)getDateFromMediaTime:(double)mediaTime
{
  NSDate *now = [NSDate now];
  return [now dateByAddingTimeInterval:(mediaTime / 1000 - CACurrentMediaTime())];
}

@end
