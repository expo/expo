#ifdef __cplusplus
#import <cxxreact/ReactMarker.h>
using namespace facebook::react::ReactMarker;
#endif

NS_SWIFT_NAME(ReactMarker)
@interface EXAppMetricsReactMarker : NSObject

+ (double)getAppStartupEndTime;
+ (double)getRunJSBundleStartTime;

@end
