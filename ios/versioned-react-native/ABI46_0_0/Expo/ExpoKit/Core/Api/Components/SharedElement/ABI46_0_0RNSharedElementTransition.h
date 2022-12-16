//
//  ABI46_0_0RNSharedElementTransition.h
//  ABI46_0_0React-native-shared-element
//

#ifndef ABI46_0_0RNSharedElementTransition_h
#define ABI46_0_0RNSharedElementTransition_h

#import <ABI46_0_0React/ABI46_0_0RCTView.h>
#import <UIKit/UIKit.h>
#import "ABI46_0_0RNSharedElementNodeManager.h"
#import "ABI46_0_0RNSharedElementDelegate.h"

@interface ABI46_0_0RNSharedElementTransition : UIView <ABI46_0_0RNSharedElementDelegate>

@property (nonatomic, assign) CGFloat nodePosition;
@property (nonatomic, assign) ABI46_0_0RNSharedElementAnimation animation;
@property (nonatomic, assign) ABI46_0_0RNSharedElementResize resize;
@property (nonatomic, assign) ABI46_0_0RNSharedElementAlign align;
@property (nonatomic, strong) ABI46_0_0RNSharedElementNode* startNode;
@property (nonatomic, strong) ABI46_0_0RNSharedElementNode* startAncestor;
@property (nonatomic, copy) ABI46_0_0RCTDirectEventBlock onMeasureNode;
@property (nonatomic, strong) ABI46_0_0RNSharedElementNode* endNode;
@property (nonatomic, strong) ABI46_0_0RNSharedElementNode* endAncestor;

- (instancetype)initWithNodeManager:(ABI46_0_0RNSharedElementNodeManager*)nodeManager;

@end

#endif
