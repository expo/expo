#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTView.h>
#import <UIKit/UIKit.h>

#import "ABI49_0_0RNCSafeAreaViewEdges.h"
#import "ABI49_0_0RNCSafeAreaViewMode.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI49_0_0RNCSafeAreaView;

@interface ABI49_0_0RNCSafeAreaView : ABI49_0_0RCTView

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge;

@property (nonatomic, assign) ABI49_0_0RNCSafeAreaViewMode mode;
@property (nonatomic, assign) ABI49_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
