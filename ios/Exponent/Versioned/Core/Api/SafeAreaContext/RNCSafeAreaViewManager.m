#import "RNCSafeAreaViewManager.h"

#import "RNCSafeAreaView.h"

@implementation RNCSafeAreaViewManager

RCT_EXPORT_MODULE(RNCSafeAreaView)

RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, RCTBubblingEventBlock)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (UIView *)view
{
  return [RNCSafeAreaView new];
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
