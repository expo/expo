#import "RNCSafeAreaContext.h"

#if __has_include(<SafeAreaContextSpec/SafeAreaContextSpec.h>)
#define RCT_USE_CODEGEN 1
#else
#define RCT_USE_CODEGEN 0
#endif

#import <UIKit/UIKit.h>
#import <React/RCTUtils.h>
#if RCT_USE_CODEGEN
#import <SafeAreaContextSpec/SafeAreaContextSpec.h>
#endif

#if RCT_USE_CODEGEN
using namespace facebook::react;

@interface RNCSafeAreaContext () <NativeSafeAreaContextSpec>
@end
#endif

@implementation RNCSafeAreaContext

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary *)getConstants
{
  __block NSDictionary *constants;

  RCTUnsafeExecuteOnMainQueueSync(^{
    UIWindow *window = RCTKeyWindow();
    if (window == nil) {
      constants = @{@"initialWindowMetrics" : [NSNull null]};
      return;
    }

    UIEdgeInsets safeAreaInsets = window.safeAreaInsets;
    constants = @{
      @"initialWindowMetrics" : @{
        @"insets" : @{
          @"top" : @(safeAreaInsets.top),
          @"right" : @(safeAreaInsets.right),
          @"bottom" : @(safeAreaInsets.bottom),
          @"left" : @(safeAreaInsets.left),
        },
        @"frame" : @{
          @"x" : @(window.frame.origin.x),
          @"y" : @(window.frame.origin.y),
          @"width" : @(window.frame.size.width),
          @"height" : @(window.frame.size.height),
        },
      }
    };
  });
  
  return constants;
}

#if RCT_USE_CODEGEN

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeSafeAreaContextSpecJSI>(params);
}

#endif

@end
