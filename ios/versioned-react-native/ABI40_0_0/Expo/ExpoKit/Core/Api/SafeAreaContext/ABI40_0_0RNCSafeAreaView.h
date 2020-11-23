#import <UIKit/UIKit.h>
#import <ABI40_0_0React/ABI40_0_0RCTView.h>
#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>

#import "ABI40_0_0RNCSafeAreaViewMode.h"
#import "ABI40_0_0RNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI40_0_0RNCSafeAreaView;

@interface ABI40_0_0RNCSafeAreaView: ABI40_0_0RCTView

- (instancetype)initWithBridge:(ABI40_0_0RCTBridge *)bridge;

@property (nonatomic, assign) ABI40_0_0RNCSafeAreaViewMode mode;
@property (nonatomic, assign) ABI40_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
