//
//  ABI35_0_0RNSharedElementTransition.h
//  ReactABI35_0_0-native-shared-element
//

#ifndef ABI35_0_0RNSharedElementTransition_h
#define ABI35_0_0RNSharedElementTransition_h

#import <ReactABI35_0_0/ABI35_0_0RCTView.h>
#import <UIKit/UIKit.h>
#import "ABI35_0_0RNSharedElementNodeManager.h"
#import "ABI35_0_0RNSharedElementDelegate.h"

@interface ABI35_0_0RNSharedElementTransition : UIView <ABI35_0_0RNSharedElementDelegate>

@property (nonatomic, assign) CGFloat nodePosition;
@property (nonatomic, assign) ABI35_0_0RNSharedElementAnimation animation;
@property (nonatomic, assign) ABI35_0_0RNSharedElementResize resize;
@property (nonatomic, assign) ABI35_0_0RNSharedElementAlign align;
@property (nonatomic, assign) ABI35_0_0RNSharedElementNode* startNode;
@property (nonatomic, assign) ABI35_0_0RNSharedElementNode* startAncestor;
@property (nonatomic, copy) ABI35_0_0RCTDirectEventBlock onMeasureNode;
@property (nonatomic, assign) ABI35_0_0RNSharedElementNode* endNode;
@property (nonatomic, assign) ABI35_0_0RNSharedElementNode* endAncestor;

- (instancetype)initWithNodeManager:(ABI35_0_0RNSharedElementNodeManager*)nodeManager;

@end

#endif
