//
//  ABI38_0_0RNSharedElementTransition.h
//  ABI38_0_0React-native-shared-element
//

#ifndef ABI38_0_0RNSharedElementTransition_h
#define ABI38_0_0RNSharedElementTransition_h

#import <ABI38_0_0React/ABI38_0_0RCTView.h>
#import <UIKit/UIKit.h>
#import "ABI38_0_0RNSharedElementNodeManager.h"
#import "ABI38_0_0RNSharedElementDelegate.h"

@interface ABI38_0_0RNSharedElementTransition : UIView <ABI38_0_0RNSharedElementDelegate>

@property (nonatomic, assign) CGFloat nodePosition;
@property (nonatomic, assign) ABI38_0_0RNSharedElementAnimation animation;
@property (nonatomic, assign) ABI38_0_0RNSharedElementResize resize;
@property (nonatomic, assign) ABI38_0_0RNSharedElementAlign align;
@property (nonatomic, assign) ABI38_0_0RNSharedElementNode* startNode;
@property (nonatomic, assign) ABI38_0_0RNSharedElementNode* startAncestor;
@property (nonatomic, copy) ABI38_0_0RCTDirectEventBlock onMeasureNode;
@property (nonatomic, assign) ABI38_0_0RNSharedElementNode* endNode;
@property (nonatomic, assign) ABI38_0_0RNSharedElementNode* endAncestor;

- (instancetype)initWithNodeManager:(ABI38_0_0RNSharedElementNodeManager*)nodeManager;

@end

#endif
