#import <UIKit/UIKit.h>

#import "ABI39_0_0RNCSafeAreaViewMode.h"
#import "ABI39_0_0RNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0RNCSafeAreaViewLocalData : NSObject

- (instancetype)initWithInsets:(UIEdgeInsets)insets mode:(ABI39_0_0RNCSafeAreaViewMode)mode edges:(ABI39_0_0RNCSafeAreaViewEdges)edges;

@property (atomic, readonly) UIEdgeInsets insets;
@property (atomic, readonly) ABI39_0_0RNCSafeAreaViewMode mode;
@property (atomic, readonly) ABI39_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
