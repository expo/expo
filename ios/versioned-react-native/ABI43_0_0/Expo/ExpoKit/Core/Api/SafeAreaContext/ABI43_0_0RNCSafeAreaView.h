#import <UIKit/UIKit.h>
#import <ABI43_0_0React/ABI43_0_0RCTView.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>

#import "ABI43_0_0RNCSafeAreaViewMode.h"
#import "ABI43_0_0RNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI43_0_0RNCSafeAreaView;

@interface ABI43_0_0RNCSafeAreaView: ABI43_0_0RCTView

- (instancetype)initWithBridge:(ABI43_0_0RCTBridge *)bridge;

@property (nonatomic, assign) ABI43_0_0RNCSafeAreaViewMode mode;
@property (nonatomic, assign) ABI43_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
