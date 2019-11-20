//
//  ABI36_0_0RNSharedElementTransition.h
//  ABI36_0_0React-native-shared-element
//

#ifndef ABI36_0_0RNSharedElementTransition_h
#define ABI36_0_0RNSharedElementTransition_h

#import <ABI36_0_0React/ABI36_0_0RCTView.h>
#import <UIKit/UIKit.h>
#import "ABI36_0_0RNSharedElementNodeManager.h"
#import "ABI36_0_0RNSharedElementDelegate.h"

@interface ABI36_0_0RNSharedElementTransition : UIView <ABI36_0_0RNSharedElementDelegate>

@property (nonatomic, assign) CGFloat nodePosition;
@property (nonatomic, assign) ABI36_0_0RNSharedElementAnimation animation;
@property (nonatomic, assign) ABI36_0_0RNSharedElementResize resize;
@property (nonatomic, assign) ABI36_0_0RNSharedElementAlign align;
@property (nonatomic, assign) ABI36_0_0RNSharedElementNode* startNode;
@property (nonatomic, assign) ABI36_0_0RNSharedElementNode* startAncestor;
@property (nonatomic, copy) ABI36_0_0RCTDirectEventBlock onMeasureNode;
@property (nonatomic, assign) ABI36_0_0RNSharedElementNode* endNode;
@property (nonatomic, assign) ABI36_0_0RNSharedElementNode* endAncestor;

- (instancetype)initWithNodeManager:(ABI36_0_0RNSharedElementNodeManager*)nodeManager;

@end

#endif
