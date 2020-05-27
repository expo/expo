#import <UIKit/UIKit.h>

#import "RNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@interface RNCSafeAreaViewLocalData : NSObject

- (instancetype)initWithInsets:(UIEdgeInsets)insets edges:(RNCSafeAreaViewEdges)edges;

@property (atomic, readonly) UIEdgeInsets insets;
@property (atomic, readonly) RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
