#import "ABI41_0_0RNCSafeAreaViewManager.h"

#import "ABI41_0_0RNCSafeAreaShadowView.h"
#import "ABI41_0_0RNCSafeAreaView.h"
#import "ABI41_0_0RNCSafeAreaViewMode.h"
#import "ABI41_0_0RNCSafeAreaViewEdges.h"

@implementation ABI41_0_0RNCSafeAreaViewManager

ABI41_0_0RCT_EXPORT_MODULE(ABI41_0_0RNCSafeAreaView)

- (UIView *)view
{
  return [[ABI41_0_0RNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI41_0_0RNCSafeAreaShadowView *)shadowView
{
  return [ABI41_0_0RNCSafeAreaShadowView new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(mode, ABI41_0_0RNCSafeAreaViewMode)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(edges, ABI41_0_0RNCSafeAreaViewEdges)

@end
