#import <UIKit/UIKit.h>
#import <React/RCTView.h>
#import <React/RCTBridge.h>

#import "DevMenuRNCSafeAreaViewMode.h"
#import "DevMenuRNCSafeAreaViewEdges.h"

NS_ASSUME_NONNULL_BEGIN

@class DevMenuRNCSafeAreaView;

@interface DevMenuRNCSafeAreaView: RCTView

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@property (nonatomic, assign) DevMenuRNCSafeAreaViewMode mode;
@property (nonatomic, assign) DevMenuRNCSafeAreaViewEdges edges;

@end

NS_ASSUME_NONNULL_END
