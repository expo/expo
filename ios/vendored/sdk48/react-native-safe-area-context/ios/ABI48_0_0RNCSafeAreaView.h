#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTView.h>
#import <UIKit/UIKit.h>

#import "ABI48_0_0RNCSafeAreaViewEdges.h"
#import "ABI48_0_0RNCSafeAreaViewMode.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI48_0_0RNCSafeAreaView;

@interface ABI48_0_0RNCSafeAreaView : ABI48_0_0RCTView

- (instancetype)initWithBridge:(ABI48_0_0RCTBridge *)bridge;

@property (nonatomic, assign) ABI48_0_0RNCSafeAreaViewMode mode;
@property (nonatomic, assign) ABI48_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
