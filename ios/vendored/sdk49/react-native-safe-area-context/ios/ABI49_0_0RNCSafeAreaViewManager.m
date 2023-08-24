#import "ABI49_0_0RNCSafeAreaViewManager.h"

#import "ABI49_0_0RNCSafeAreaShadowView.h"
#import "ABI49_0_0RNCSafeAreaView.h"
#import "ABI49_0_0RNCSafeAreaViewEdges.h"
#import "ABI49_0_0RNCSafeAreaViewMode.h"

@implementation ABI49_0_0RNCSafeAreaViewManager

ABI49_0_0RCT_EXPORT_MODULE(ABI49_0_0RNCSafeAreaView)

- (UIView *)view
{
  return [[ABI49_0_0RNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI49_0_0RNCSafeAreaShadowView *)shadowView
{
  return [ABI49_0_0RNCSafeAreaShadowView new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(mode, ABI49_0_0RNCSafeAreaViewMode)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(edges, ABI49_0_0RNCSafeAreaViewEdges)

@end
