//
//  ABI37_0_0RNSharedElementTransition.h
//  ABI37_0_0React-native-shared-element
//

#ifndef ABI37_0_0RNSharedElementTransitionItem_h
#define ABI37_0_0RNSharedElementTransitionItem_h

#import "ABI37_0_0RNSharedElementNodeManager.h"

@interface ABI37_0_0RNSharedElementTransitionItem : NSObject

@property (nonatomic, readonly) ABI37_0_0RNSharedElementNodeManager* nodeManager;
@property (nonatomic, readonly) BOOL isAncestor;
@property (nonatomic, readonly) NSString* name;
@property (nonatomic, assign) ABI37_0_0RNSharedElementNode* node;
@property (nonatomic, assign) BOOL hidden;
@property (nonatomic, assign) BOOL needsLayout;
@property (nonatomic, assign) BOOL needsContent;
@property (nonatomic, assign) BOOL hasCalledOnMeasure;
@property (nonatomic, assign) ABI37_0_0RNSharedElementStyle* style;
@property (nonatomic, assign) ABI37_0_0RNSharedElementContent* content;

- (instancetype)initWithNodeManager:(ABI37_0_0RNSharedElementNodeManager*)nodeManager name:(NSString*)name isAncestor:(BOOL)isAncestor;

- (CGRect) contentLayoutForContent:(ABI37_0_0RNSharedElementContent*)content;
- (CGRect) visibleLayoutForAncestor:(ABI37_0_0RNSharedElementTransitionItem*) ancestor;

@end

#endif
