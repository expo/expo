#import "RNCSafeAreaViewManager.h"

#import "RNCSafeAreaShadowView.h"
#import "RNCSafeAreaView.h"
#import "RNCSafeAreaViewMode.h"
#import "RNCSafeAreaViewEdges.h"

@implementation RNCSafeAreaViewManager

RCT_EXPORT_MODULE(RNCSafeAreaView)

- (UIView *)view
{
  return [[RNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (RNCSafeAreaShadowView *)shadowView
{
  return [RNCSafeAreaShadowView new];
}

RCT_EXPORT_VIEW_PROPERTY(mode, RNCSafeAreaViewMode)
RCT_EXPORT_VIEW_PROPERTY(edges, RNCSafeAreaViewEdges)

@end
