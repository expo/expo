//
//  ABI43_0_0RNSharedElementTransition.h
//  ABI43_0_0React-native-shared-element
//

#ifndef ABI43_0_0RNSharedElementTransition_h
#define ABI43_0_0RNSharedElementTransition_h

#import <ABI43_0_0React/ABI43_0_0RCTView.h>
#import <UIKit/UIKit.h>
#import "ABI43_0_0RNSharedElementNodeManager.h"
#import "ABI43_0_0RNSharedElementDelegate.h"

@interface ABI43_0_0RNSharedElementTransition : UIView <ABI43_0_0RNSharedElementDelegate>

@property (nonatomic, assign) CGFloat nodePosition;
@property (nonatomic, assign) ABI43_0_0RNSharedElementAnimation animation;
@property (nonatomic, assign) ABI43_0_0RNSharedElementResize resize;
@property (nonatomic, assign) ABI43_0_0RNSharedElementAlign align;
@property (nonatomic, strong) ABI43_0_0RNSharedElementNode* startNode;
@property (nonatomic, strong) ABI43_0_0RNSharedElementNode* startAncestor;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onMeasureNode;
@property (nonatomic, strong) ABI43_0_0RNSharedElementNode* endNode;
@property (nonatomic, strong) ABI43_0_0RNSharedElementNode* endAncestor;

- (instancetype)initWithNodeManager:(ABI43_0_0RNSharedElementNodeManager*)nodeManager;

@end

#endif
