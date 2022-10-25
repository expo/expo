#import "ABI47_0_0RNCSafeAreaViewManager.h"

#import "ABI47_0_0RNCSafeAreaShadowView.h"
#import "ABI47_0_0RNCSafeAreaView.h"
#import "ABI47_0_0RNCSafeAreaViewEdges.h"
#import "ABI47_0_0RNCSafeAreaViewMode.h"

@implementation ABI47_0_0RNCSafeAreaViewManager

ABI47_0_0RCT_EXPORT_MODULE(ABI47_0_0RNCSafeAreaView)

- (UIView *)view
{
  return [[ABI47_0_0RNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI47_0_0RNCSafeAreaShadowView *)shadowView
{
  return [ABI47_0_0RNCSafeAreaShadowView new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(mode, ABI47_0_0RNCSafeAreaViewMode)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(edges, ABI47_0_0RNCSafeAreaViewEdges)

@end
