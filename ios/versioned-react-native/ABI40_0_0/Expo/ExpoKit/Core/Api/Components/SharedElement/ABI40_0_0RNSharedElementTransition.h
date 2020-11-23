//
//  ABI40_0_0RNSharedElementTransition.h
//  ABI40_0_0React-native-shared-element
//

#ifndef ABI40_0_0RNSharedElementTransition_h
#define ABI40_0_0RNSharedElementTransition_h

#import <ABI40_0_0React/ABI40_0_0RCTView.h>
#import <UIKit/UIKit.h>
#import "ABI40_0_0RNSharedElementNodeManager.h"
#import "ABI40_0_0RNSharedElementDelegate.h"

@interface ABI40_0_0RNSharedElementTransition : UIView <ABI40_0_0RNSharedElementDelegate>

@property (nonatomic, assign) CGFloat nodePosition;
@property (nonatomic, assign) ABI40_0_0RNSharedElementAnimation animation;
@property (nonatomic, assign) ABI40_0_0RNSharedElementResize resize;
@property (nonatomic, assign) ABI40_0_0RNSharedElementAlign align;
@property (nonatomic, assign) ABI40_0_0RNSharedElementNode* startNode;
@property (nonatomic, assign) ABI40_0_0RNSharedElementNode* startAncestor;
@property (nonatomic, copy) ABI40_0_0RCTDirectEventBlock onMeasureNode;
@property (nonatomic, assign) ABI40_0_0RNSharedElementNode* endNode;
@property (nonatomic, assign) ABI40_0_0RNSharedElementNode* endAncestor;

- (instancetype)initWithNodeManager:(ABI40_0_0RNSharedElementNodeManager*)nodeManager;

@end

#endif
