#import "ABI37_0_0RNCSafeAreaViewManager.h"

#import "ABI37_0_0RNCSafeAreaView.h"

@implementation ABI37_0_0RNCSafeAreaViewManager

ABI37_0_0RCT_EXPORT_MODULE(ABI37_0_0RNCSafeAreaView)

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, ABI37_0_0RCTBubblingEventBlock)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (UIView *)view
{
  return [ABI37_0_0RNCSafeAreaView new];
}

- (NSDictionary *)constantsToExport
{
  if (@available(iOS 11.0, *)) {
    UIWindow* window = [[UIApplication sharedApplication] keyWindow];
    UIEdgeInsets safeAreaInsets = window.safeAreaInsets;
    return @{
      @"initialWindowSafeAreaInsets": @{
        @"top": @(safeAreaInsets.top),
        @"right": @(safeAreaInsets.right),
        @"bottom": @(safeAreaInsets.bottom),
        @"left": @(safeAreaInsets.left),
      }
    };
  } else {
    return @{ @"initialWindowSafeAreaInsets": [NSNull null] };
  }
}

@end
