//
//  ABI41_0_0RNSharedElementTransition.h
//  ABI41_0_0React-native-shared-element
//

#ifndef ABI41_0_0RNSharedElementTransitionItem_h
#define ABI41_0_0RNSharedElementTransitionItem_h

#import "ABI41_0_0RNSharedElementNodeManager.h"

@interface ABI41_0_0RNSharedElementTransitionItem : NSObject

@property (nonatomic, readonly) ABI41_0_0RNSharedElementNodeManager* nodeManager;
@property (nonatomic, readonly) BOOL isAncestor;
@property (nonatomic, readonly) NSString* name;
@property (nonatomic, assign) ABI41_0_0RNSharedElementNode* node;
@property (nonatomic, assign) BOOL hidden;
@property (nonatomic, assign) BOOL needsLayout;
@property (nonatomic, assign) BOOL needsContent;
@property (nonatomic, assign) BOOL hasCalledOnMeasure;
@property (nonatomic, assign) ABI41_0_0RNSharedElementStyle* style;
@property (nonatomic, assign) ABI41_0_0RNSharedElementContent* content;

- (instancetype)initWithNodeManager:(ABI41_0_0RNSharedElementNodeManager*)nodeManager name:(NSString*)name isAncestor:(BOOL)isAncestor;

- (CGRect) contentLayoutForContent:(ABI41_0_0RNSharedElementContent*)content;
- (CGRect) visibleLayoutForAncestor:(ABI41_0_0RNSharedElementTransitionItem*) ancestor;

@end

#endif
