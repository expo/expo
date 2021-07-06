#import "ABI41_0_0RNCSafeAreaProviderManager.h"

#import "ABI41_0_0RNCSafeAreaProvider.h"

@implementation ABI41_0_0RNCSafeAreaProviderManager

ABI41_0_0RCT_EXPORT_MODULE(ABI41_0_0RNCSafeAreaProvider)

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, ABI41_0_0RCTDirectEventBlock)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (UIView *)view
{
  return [ABI41_0_0RNCSafeAreaProvider new];
}

- (NSDictionary *)constantsToExport
{
    UIWindow* window = [[UIApplication sharedApplication] keyWindow];
  if (@available(iOS 11.0, *)) {
    UIEdgeInsets safeAreaInsets = window.safeAreaInsets;
    return @{
      @"initialWindowMetrics": @{
        @"insets": @{
          @"top": @(safeAreaInsets.top),
          @"right": @(safeAreaInsets.right),
          @"bottom": @(safeAreaInsets.bottom),
          @"left": @(safeAreaInsets.left),
        },
        @"frame": @{
          @"x": @(window.frame.origin.x),
          @"y": @(window.frame.origin.y),
          @"width": @(window.frame.size.width),
          @"height": @(window.frame.size.height),
        },
      }
    };
  } else {
    return @{ @"initialWindowMetrics": @{
        @"insets": @{
          @"top": @(20),
          @"right": @(0),
          @"bottom": @(0),
          @"left": @(0),
        },
        @"frame": @{
          @"x": @(window.frame.origin.x),
          @"y": @(window.frame.origin.y),
          @"width": @(window.frame.size.width),
          @"height": @(window.frame.size.height),
        },
      }
    } ;
  }
}

@end
