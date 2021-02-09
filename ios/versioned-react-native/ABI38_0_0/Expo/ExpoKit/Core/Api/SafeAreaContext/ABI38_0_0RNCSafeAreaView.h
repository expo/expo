#import <UIKit/UIKit.h>
#import <ABI38_0_0React/ABI38_0_0RCTView.h>
#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>

#import "ABI38_0_0RNCSafeAreaViewMode.h"
#import "ABI38_0_0RNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI38_0_0RNCSafeAreaView;

@interface ABI38_0_0RNCSafeAreaView: ABI38_0_0RCTView

- (instancetype)initWithBridge:(ABI38_0_0RCTBridge *)bridge;

@property (nonatomic, assign) ABI38_0_0RNCSafeAreaViewMode mode;
@property (nonatomic, assign) ABI38_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
