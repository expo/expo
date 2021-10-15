#import "ABI43_0_0RNCSafeAreaProviderManager.h"

#import "ABI43_0_0RNCSafeAreaProvider.h"

@implementation ABI43_0_0RNCSafeAreaProviderManager

ABI43_0_0RCT_EXPORT_MODULE(ABI43_0_0RNCSafeAreaProvider)

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, ABI43_0_0RCTDirectEventBlock)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (UIView *)view
{
  return [ABI43_0_0RNCSafeAreaProvider new];
}

- (NSDictionary *)constantsToExport
{
  UIWindow* window = [[UIApplication sharedApplication] keyWindow];

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
}

@end
