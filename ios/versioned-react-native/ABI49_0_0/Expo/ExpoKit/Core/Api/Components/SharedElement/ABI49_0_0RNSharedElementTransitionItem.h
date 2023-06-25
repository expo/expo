//
//  ABI49_0_0RNSharedElementTransition.h
//  ABI49_0_0React-native-shared-element
//

#ifndef ABI49_0_0RNSharedElementTransitionItem_h
#define ABI49_0_0RNSharedElementTransitionItem_h

#import "ABI49_0_0RNSharedElementNodeManager.h"

@interface ABI49_0_0RNSharedElementTransitionItem : NSObject

@property (nonatomic, readonly) ABI49_0_0RNSharedElementNodeManager* nodeManager;
@property (nonatomic, readonly) BOOL isAncestor;
@property (nonatomic, readonly) NSString* name;
@property (nonatomic, strong) ABI49_0_0RNSharedElementNode* node;
@property (nonatomic, assign) BOOL hidden;
@property (nonatomic, assign) BOOL needsLayout;
@property (nonatomic, assign) BOOL needsContent;
@property (nonatomic, assign) BOOL hasCalledOnMeasure;
@property (nonatomic, strong) ABI49_0_0RNSharedElementStyle* style;
@property (nonatomic, strong) ABI49_0_0RNSharedElementContent* content;

- (instancetype)initWithNodeManager:(ABI49_0_0RNSharedElementNodeManager*)nodeManager name:(NSString*)name isAncestor:(BOOL)isAncestor;

- (CGRect) contentLayoutForContent:(ABI49_0_0RNSharedElementContent*)content;
- (CGRect) visibleLayoutForAncestor:(ABI49_0_0RNSharedElementTransitionItem*) ancestor;

@end

#endif
