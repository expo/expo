#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, DevMenuRNCSafeAreaViewEdges) {
  DevMenuRNCSafeAreaViewEdgesTop    = 0b1000,
  DevMenuRNCSafeAreaViewEdgesRight  = 0b0100,
  DevMenuRNCSafeAreaViewEdgesBottom = 0b0010,
  DevMenuRNCSafeAreaViewEdgesLeft   = 0b0001,
  DevMenuRNCSafeAreaViewEdgesAll    = 0b1111,
};
