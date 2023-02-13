#import "ABI48_0_0RNCSafeAreaContext.h"

#if __has_include(<safeareacontext/safeareacontext.h>)
#define ABI48_0_0RCT_USE_CODEGEN 1
#else
#define ABI48_0_0RCT_USE_CODEGEN 0
#endif

#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>
#import <UIKit/UIKit.h>
#if ABI48_0_0RCT_USE_CODEGEN
#import <safeareacontext/safeareacontext.h>
#endif

#if ABI48_0_0RCT_USE_CODEGEN
using namespace ABI48_0_0facebook::ABI48_0_0React;

@interface ABI48_0_0RNCSafeAreaContext () <NativeSafeAreaContextSpec>
@end
#endif

@implementation ABI48_0_0RNCSafeAreaContext

ABI48_0_0RCT_EXPORT_MODULE()

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

  ABI48_0_0RCTUnsafeExecuteOnMainQueueSync(^{
    UIWindow *window = ABI48_0_0RCTKeyWindow();
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

#if ABI48_0_0RCT_USE_CODEGEN

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeSafeAreaContextSpecJSI>(params);
}

#endif

@end
