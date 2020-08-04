#import <UIKit/UIKit.h>

#import "ABI38_0_0RNCSafeAreaViewMode.h"
#import "ABI38_0_0RNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI38_0_0RNCSafeAreaViewLocalData : NSObject

- (instancetype)initWithInsets:(UIEdgeInsets)insets mode:(ABI38_0_0RNCSafeAreaViewMode)mode edges:(ABI38_0_0RNCSafeAreaViewEdges)edges;

@property (atomic, readonly) UIEdgeInsets insets;
@property (atomic, readonly) ABI38_0_0RNCSafeAreaViewMode mode;
@property (atomic, readonly) ABI38_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
