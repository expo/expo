#import "ABI44_0_0RNCSafeAreaViewManager.h"

#import "ABI44_0_0RNCSafeAreaShadowView.h"
#import "ABI44_0_0RNCSafeAreaView.h"
#import "ABI44_0_0RNCSafeAreaViewMode.h"
#import "ABI44_0_0RNCSafeAreaViewEdges.h"

@implementation ABI44_0_0RNCSafeAreaViewManager

ABI44_0_0RCT_EXPORT_MODULE(ABI44_0_0RNCSafeAreaView)

- (UIView *)view
{
  return [[ABI44_0_0RNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI44_0_0RNCSafeAreaShadowView *)shadowView
{
  return [ABI44_0_0RNCSafeAreaShadowView new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(mode, ABI44_0_0RNCSafeAreaViewMode)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(edges, ABI44_0_0RNCSafeAreaViewEdges)

@end
