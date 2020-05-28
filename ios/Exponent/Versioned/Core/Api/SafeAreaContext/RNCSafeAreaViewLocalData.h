#import <UIKit/UIKit.h>

#import "RNCSafeAreaViewMode.h"
#import "RNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@interface RNCSafeAreaViewLocalData : NSObject

- (instancetype)initWithInsets:(UIEdgeInsets)insets mode:(RNCSafeAreaViewMode)mode edges:(RNCSafeAreaViewEdges)edges;

@property (atomic, readonly) UIEdgeInsets insets;
@property (atomic, readonly) RNCSafeAreaViewMode mode;
@property (atomic, readonly) RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
