//
//  ABI45_0_0RNSharedElementTransition.h
//  ABI45_0_0React-native-shared-element
//

#ifndef ABI45_0_0RNSharedElementTransition_h
#define ABI45_0_0RNSharedElementTransition_h

#import <ABI45_0_0React/ABI45_0_0RCTView.h>
#import <UIKit/UIKit.h>
#import "ABI45_0_0RNSharedElementNodeManager.h"
#import "ABI45_0_0RNSharedElementDelegate.h"

@interface ABI45_0_0RNSharedElementTransition : UIView <ABI45_0_0RNSharedElementDelegate>

@property (nonatomic, assign) CGFloat nodePosition;
@property (nonatomic, assign) ABI45_0_0RNSharedElementAnimation animation;
@property (nonatomic, assign) ABI45_0_0RNSharedElementResize resize;
@property (nonatomic, assign) ABI45_0_0RNSharedElementAlign align;
@property (nonatomic, strong) ABI45_0_0RNSharedElementNode* startNode;
@property (nonatomic, strong) ABI45_0_0RNSharedElementNode* startAncestor;
@property (nonatomic, copy) ABI45_0_0RCTDirectEventBlock onMeasureNode;
@property (nonatomic, strong) ABI45_0_0RNSharedElementNode* endNode;
@property (nonatomic, strong) ABI45_0_0RNSharedElementNode* endAncestor;

- (instancetype)initWithNodeManager:(ABI45_0_0RNSharedElementNodeManager*)nodeManager;

@end

#endif
