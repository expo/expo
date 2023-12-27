#import <UIKit/UIKit.h>
#import <ABI44_0_0React/ABI44_0_0RCTView.h>
#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>

#import "ABI44_0_0RNCSafeAreaViewMode.h"
#import "ABI44_0_0RNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI44_0_0RNCSafeAreaView;

@interface ABI44_0_0RNCSafeAreaView: ABI44_0_0RCTView

- (instancetype)initWithBridge:(ABI44_0_0RCTBridge *)bridge;

@property (nonatomic, assign) ABI44_0_0RNCSafeAreaViewMode mode;
@property (nonatomic, assign) ABI44_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
