#import "ABI46_0_0RNCSafeAreaViewManager.h"

#import "ABI46_0_0RNCSafeAreaShadowView.h"
#import "ABI46_0_0RNCSafeAreaView.h"
#import "ABI46_0_0RNCSafeAreaViewEdges.h"
#import "ABI46_0_0RNCSafeAreaViewMode.h"

@implementation ABI46_0_0RNCSafeAreaViewManager

ABI46_0_0RCT_EXPORT_MODULE(ABI46_0_0RNCSafeAreaView)

- (UIView *)view
{
  return [[ABI46_0_0RNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI46_0_0RNCSafeAreaShadowView *)shadowView
{
  return [ABI46_0_0RNCSafeAreaShadowView new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(mode, ABI46_0_0RNCSafeAreaViewMode)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(edges, ABI46_0_0RNCSafeAreaViewEdges)

@end
