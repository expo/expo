#import <UIKit/UIKit.h>
#import <ABI39_0_0React/ABI39_0_0RCTView.h>
#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>

#import "ABI39_0_0RNCSafeAreaViewMode.h"
#import "ABI39_0_0RNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI39_0_0RNCSafeAreaView;

@interface ABI39_0_0RNCSafeAreaView: ABI39_0_0RCTView

- (instancetype)initWithBridge:(ABI39_0_0RCTBridge *)bridge;

@property (nonatomic, assign) ABI39_0_0RNCSafeAreaViewMode mode;
@property (nonatomic, assign) ABI39_0_0RNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
