#import "ABI43_0_0RNCSafeAreaViewManager.h"

#import "ABI43_0_0RNCSafeAreaShadowView.h"
#import "ABI43_0_0RNCSafeAreaView.h"
#import "ABI43_0_0RNCSafeAreaViewMode.h"
#import "ABI43_0_0RNCSafeAreaViewEdges.h"

@implementation ABI43_0_0RNCSafeAreaViewManager

ABI43_0_0RCT_EXPORT_MODULE(ABI43_0_0RNCSafeAreaView)

- (UIView *)view
{
  return [[ABI43_0_0RNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI43_0_0RNCSafeAreaShadowView *)shadowView
{
  return [ABI43_0_0RNCSafeAreaShadowView new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(mode, ABI43_0_0RNCSafeAreaViewMode)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(edges, ABI43_0_0RNCSafeAreaViewEdges)

@end
