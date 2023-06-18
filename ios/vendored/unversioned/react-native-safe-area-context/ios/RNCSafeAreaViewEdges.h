#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RNCSafeAreaViewEdges) {
  RNCSafeAreaViewEdgesTop = 0b1000,
  RNCSafeAreaViewEdgesRight = 0b0100,
  RNCSafeAreaViewEdgesBottom = 0b0010,
  RNCSafeAreaViewEdgesLeft = 0b0001,
  RNCSafeAreaViewEdgesAll = 0b1111,
  RNCSafeAreaViewEdgesNone = 0b0000,
};
