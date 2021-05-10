#import <UIKit/UIKit.h>
#import <ABI41_0_0React/ABI41_0_0RCTView.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>

#import "ABI41_0_0RNCSafeAreaViewMode.h"
#import "ABI41_0_0RNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI41_0_0RNCSafeAreaView;

@interface ABI41_0_0RNCSafeAreaView: ABI41_0_0RCTView

- (instancetype)initWithBridge:(ABI41_0_0RCTBridge *)bridge;

@property (nonatomic, assign) ABI41_0_0RNCSafeAreaViewMode mode;
@property (nonatomic, assign) ABI41_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
