//
//  ABI43_0_0RNSharedElementTransition.h
//  ABI43_0_0React-native-shared-element
//

#ifndef ABI43_0_0RNSharedElementTransitionItem_h
#define ABI43_0_0RNSharedElementTransitionItem_h

#import "ABI43_0_0RNSharedElementNodeManager.h"

@interface ABI43_0_0RNSharedElementTransitionItem : NSObject

@property (nonatomic, readonly) ABI43_0_0RNSharedElementNodeManager* nodeManager;
@property (nonatomic, readonly) BOOL isAncestor;
@property (nonatomic, readonly) NSString* name;
@property (nonatomic, strong) ABI43_0_0RNSharedElementNode* node;
@property (nonatomic, assign) BOOL hidden;
@property (nonatomic, assign) BOOL needsLayout;
@property (nonatomic, assign) BOOL needsContent;
@property (nonatomic, assign) BOOL hasCalledOnMeasure;
@property (nonatomic, strong) ABI43_0_0RNSharedElementStyle* style;
@property (nonatomic, strong) ABI43_0_0RNSharedElementContent* content;

- (instancetype)initWithNodeManager:(ABI43_0_0RNSharedElementNodeManager*)nodeManager name:(NSString*)name isAncestor:(BOOL)isAncestor;

- (CGRect) contentLayoutForContent:(ABI43_0_0RNSharedElementContent*)content;
- (CGRect) visibleLayoutForAncestor:(ABI43_0_0RNSharedElementTransitionItem*) ancestor;

@end

#endif
