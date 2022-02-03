#import <React/RCTConvert.h>
#import "DevMenuRNCSafeAreaViewEdges.h"

@implementation RCTConvert (DevMenuRNCSafeAreaView)

RCT_MULTI_ENUM_CONVERTER(DevMenuRNCSafeAreaViewEdges, (@{
  @"top": @(DevMenuRNCSafeAreaViewEdgesTop),
  @"right": @(DevMenuRNCSafeAreaViewEdgesRight),
  @"bottom": @(DevMenuRNCSafeAreaViewEdgesBottom),
  @"left": @(DevMenuRNCSafeAreaViewEdgesLeft),
}), DevMenuRNCSafeAreaViewEdgesAll, integerValue);

@end
