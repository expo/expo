#import "DevMenuRNCSafeAreaViewManager.h"

#import "DevMenuRNCSafeAreaShadowView.h"
#import "DevMenuRNCSafeAreaView.h"
#import "DevMenuRNCSafeAreaViewMode.h"
#import "DevMenuRNCSafeAreaViewEdges.h"

@implementation DevMenuRNCSafeAreaViewManager

+ (NSString *)moduleName { return @"RNCSafeAreaView"; }

- (UIView *)view
{
  return [[DevMenuRNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (DevMenuRNCSafeAreaShadowView *)shadowView
{
  return [DevMenuRNCSafeAreaShadowView new];
}

RCT_EXPORT_VIEW_PROPERTY(mode, DevMenuRNCSafeAreaViewMode)
RCT_EXPORT_VIEW_PROPERTY(edges, DevMenuRNCSafeAreaViewEdges)

@end
