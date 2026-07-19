#ifdef __cplusplus
#import <cxxreact/ReactMarker.h>
using namespace facebook::react::ReactMarker;
#endif

NS_SWIFT_NAME(ReactMarker)
@interface EXReactMarker : NSObject

+ (NSDate *)getAppStartupEndTime;
+ (NSDate *)getRunJSBundleStartTime;
+ (NSDate *)getRunJSBundleEndTime;
+ (NSDate *)getDateFromMediaTime:(double)mediaTime;

@end

