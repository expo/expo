//
//  ABI48_0_0RNSharedElementTransition.h
//  ABI48_0_0React-native-shared-element
//

#ifndef ABI48_0_0RNSharedElementTransition_h
#define ABI48_0_0RNSharedElementTransition_h

#import <ABI48_0_0React/ABI48_0_0RCTView.h>
#import <UIKit/UIKit.h>
#import "ABI48_0_0RNSharedElementNodeManager.h"
#import "ABI48_0_0RNSharedElementDelegate.h"

@interface ABI48_0_0RNSharedElementTransition : UIView <ABI48_0_0RNSharedElementDelegate>

@property (nonatomic, assign) CGFloat nodePosition;
@property (nonatomic, assign) ABI48_0_0RNSharedElementAnimation animation;
@property (nonatomic, assign) ABI48_0_0RNSharedElementResize resize;
@property (nonatomic, assign) ABI48_0_0RNSharedElementAlign align;
@property (nonatomic, strong) ABI48_0_0RNSharedElementNode* startNode;
@property (nonatomic, strong) ABI48_0_0RNSharedElementNode* startAncestor;
@property (nonatomic, copy) ABI48_0_0RCTDirectEventBlock onMeasureNode;
@property (nonatomic, strong) ABI48_0_0RNSharedElementNode* endNode;
@property (nonatomic, strong) ABI48_0_0RNSharedElementNode* endAncestor;

- (instancetype)initWithNodeManager:(ABI48_0_0RNSharedElementNodeManager*)nodeManager;

@end

#endif
