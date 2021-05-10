#import "ABI39_0_0RNCSafeAreaViewManager.h"

#import "ABI39_0_0RNCSafeAreaShadowView.h"
#import "ABI39_0_0RNCSafeAreaView.h"
#import "ABI39_0_0RNCSafeAreaViewMode.h"
#import "ABI39_0_0RNCSafeAreaViewEdges.h"

@implementation ABI39_0_0RNCSafeAreaViewManager

ABI39_0_0RCT_EXPORT_MODULE(ABI39_0_0RNCSafeAreaView)

- (UIView *)view
{
  return [[ABI39_0_0RNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI39_0_0RNCSafeAreaShadowView *)shadowView
{
  return [ABI39_0_0RNCSafeAreaShadowView new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(mode, ABI39_0_0RNCSafeAreaViewMode)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(edges, ABI39_0_0RNCSafeAreaViewEdges)

@end
