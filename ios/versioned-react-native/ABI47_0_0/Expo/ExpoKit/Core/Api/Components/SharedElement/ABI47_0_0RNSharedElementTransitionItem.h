//
//  ABI47_0_0RNSharedElementTransition.h
//  ABI47_0_0React-native-shared-element
//

#ifndef ABI47_0_0RNSharedElementTransitionItem_h
#define ABI47_0_0RNSharedElementTransitionItem_h

#import "ABI47_0_0RNSharedElementNodeManager.h"

@interface ABI47_0_0RNSharedElementTransitionItem : NSObject

@property (nonatomic, readonly) ABI47_0_0RNSharedElementNodeManager* nodeManager;
@property (nonatomic, readonly) BOOL isAncestor;
@property (nonatomic, readonly) NSString* name;
@property (nonatomic, strong) ABI47_0_0RNSharedElementNode* node;
@property (nonatomic, assign) BOOL hidden;
@property (nonatomic, assign) BOOL needsLayout;
@property (nonatomic, assign) BOOL needsContent;
@property (nonatomic, assign) BOOL hasCalledOnMeasure;
@property (nonatomic, strong) ABI47_0_0RNSharedElementStyle* style;
@property (nonatomic, strong) ABI47_0_0RNSharedElementContent* content;

- (instancetype)initWithNodeManager:(ABI47_0_0RNSharedElementNodeManager*)nodeManager name:(NSString*)name isAncestor:(BOOL)isAncestor;

- (CGRect) contentLayoutForContent:(ABI47_0_0RNSharedElementContent*)content;
- (CGRect) visibleLayoutForAncestor:(ABI47_0_0RNSharedElementTransitionItem*) ancestor;

@end

#endif
