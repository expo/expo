#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0RCTView.h>
#import <UIKit/UIKit.h>

#import "ABI46_0_0RNCSafeAreaViewEdges.h"
#import "ABI46_0_0RNCSafeAreaViewMode.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI46_0_0RNCSafeAreaView;

@interface ABI46_0_0RNCSafeAreaView : ABI46_0_0RCTView

- (instancetype)initWithBridge:(ABI46_0_0RCTBridge *)bridge;

@property (nonatomic, assign) ABI46_0_0RNCSafeAreaViewMode mode;
@property (nonatomic, assign) ABI46_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
