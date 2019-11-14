//
//  RNSharedElementTransition.h
//  react-native-shared-element
//

#ifndef RNSharedElementTransition_h
#define RNSharedElementTransition_h

#import <React/RCTView.h>
#import <UIKit/UIKit.h>
#import "RNSharedElementNodeManager.h"
#import "RNSharedElementDelegate.h"

@interface RNSharedElementTransition : UIView <RNSharedElementDelegate>

@property (nonatomic, assign) CGFloat nodePosition;
@property (nonatomic, assign) RNSharedElementAnimation animation;
@property (nonatomic, assign) RNSharedElementResize resize;
@property (nonatomic, assign) RNSharedElementAlign align;
@property (nonatomic, assign) RNSharedElementNode* startNode;
@property (nonatomic, assign) RNSharedElementNode* startAncestor;
@property (nonatomic, copy) RCTDirectEventBlock onMeasureNode;
@property (nonatomic, assign) RNSharedElementNode* endNode;
@property (nonatomic, assign) RNSharedElementNode* endAncestor;

- (instancetype)initWithNodeManager:(RNSharedElementNodeManager*)nodeManager;

@end

#endif
