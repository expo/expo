#import <UIKit/UIKit.h>
#import <ABI42_0_0React/ABI42_0_0RCTView.h>
#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>

#import "ABI42_0_0RNCSafeAreaViewMode.h"
#import "ABI42_0_0RNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI42_0_0RNCSafeAreaView;

@interface ABI42_0_0RNCSafeAreaView: ABI42_0_0RCTView

- (instancetype)initWithBridge:(ABI42_0_0RCTBridge *)bridge;

@property (nonatomic, assign) ABI42_0_0RNCSafeAreaViewMode mode;
@property (nonatomic, assign) ABI42_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
