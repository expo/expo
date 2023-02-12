#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTView.h>
#import <UIKit/UIKit.h>

#import "ABI47_0_0RNCSafeAreaViewEdges.h"
#import "ABI47_0_0RNCSafeAreaViewMode.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI47_0_0RNCSafeAreaView;

@interface ABI47_0_0RNCSafeAreaView : ABI47_0_0RCTView

- (instancetype)initWithBridge:(ABI47_0_0RCTBridge *)bridge;

@property (nonatomic, assign) ABI47_0_0RNCSafeAreaViewMode mode;
@property (nonatomic, assign) ABI47_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
