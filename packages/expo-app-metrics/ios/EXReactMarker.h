#ifdef __cplusplus
#import <cxxreact/ReactMarker.h>
using namespace facebook::react::ReactMarker;
#endif

NS_SWIFT_NAME(ReactMarker)
@interface EXAppMetricsReactMarker : NSObject

+ (double)getAppStartupStartTime;
+ (double)getAppStartupEndTime;
+ (double)getRunJSBundleStartTime;
+ (double)getRunJSBundleEndTime;
+ (double)getInitReactRuntimeStartTime;
+ (double)getInitReactRuntimeEndTime;

@end
