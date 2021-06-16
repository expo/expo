#import "ABI42_0_0RNCSafeAreaViewManager.h"

#import "ABI42_0_0RNCSafeAreaShadowView.h"
#import "ABI42_0_0RNCSafeAreaView.h"
#import "ABI42_0_0RNCSafeAreaViewMode.h"
#import "ABI42_0_0RNCSafeAreaViewEdges.h"

@implementation ABI42_0_0RNCSafeAreaViewManager

ABI42_0_0RCT_EXPORT_MODULE(ABI42_0_0RNCSafeAreaView)

- (UIView *)view
{
  return [[ABI42_0_0RNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI42_0_0RNCSafeAreaShadowView *)shadowView
{
  return [ABI42_0_0RNCSafeAreaShadowView new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(mode, ABI42_0_0RNCSafeAreaViewMode)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(edges, ABI42_0_0RNCSafeAreaViewEdges)

@end
