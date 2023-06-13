#import <UIKit/UIKit.h>

#import "ABI47_0_0RNCSafeAreaViewEdges.h"
#import "ABI47_0_0RNCSafeAreaViewMode.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0RNCSafeAreaViewLocalData : NSObject

- (instancetype)initWithInsets:(UIEdgeInsets)insets mode:(ABI47_0_0RNCSafeAreaViewMode)mode edges:(ABI47_0_0RNCSafeAreaViewEdges)edges;

@property (atomic, readonly) UIEdgeInsets insets;
@property (atomic, readonly) ABI47_0_0RNCSafeAreaViewMode mode;
@property (atomic, readonly) ABI47_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
