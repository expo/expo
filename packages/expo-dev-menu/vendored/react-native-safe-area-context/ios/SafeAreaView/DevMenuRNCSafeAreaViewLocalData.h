#import <UIKit/UIKit.h>

#import "DevMenuRNCSafeAreaViewMode.h"
#import "DevMenuRNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@interface DevMenuRNCSafeAreaViewLocalData : NSObject

- (instancetype)initWithInsets:(UIEdgeInsets)insets mode:(DevMenuRNCSafeAreaViewMode)mode edges:(DevMenuRNCSafeAreaViewEdges)edges;

@property (atomic, readonly) UIEdgeInsets insets;
@property (atomic, readonly) DevMenuRNCSafeAreaViewMode mode;
@property (atomic, readonly) DevMenuRNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
