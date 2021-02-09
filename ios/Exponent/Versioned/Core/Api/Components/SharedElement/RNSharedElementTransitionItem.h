//
//  RNSharedElementTransition.h
//  react-native-shared-element
//

#ifndef RNSharedElementTransitionItem_h
#define RNSharedElementTransitionItem_h

#import "RNSharedElementNodeManager.h"

@interface RNSharedElementTransitionItem : NSObject

@property (nonatomic, readonly) RNSharedElementNodeManager* nodeManager;
@property (nonatomic, readonly) BOOL isAncestor;
@property (nonatomic, readonly) NSString* name;
@property (nonatomic, assign) RNSharedElementNode* node;
@property (nonatomic, assign) BOOL hidden;
@property (nonatomic, assign) BOOL needsLayout;
@property (nonatomic, assign) BOOL needsContent;
@property (nonatomic, assign) BOOL hasCalledOnMeasure;
@property (nonatomic, assign) RNSharedElementStyle* style;
@property (nonatomic, assign) RNSharedElementContent* content;

- (instancetype)initWithNodeManager:(RNSharedElementNodeManager*)nodeManager name:(NSString*)name isAncestor:(BOOL)isAncestor;

- (CGRect) contentLayoutForContent:(RNSharedElementContent*)content;
- (CGRect) visibleLayoutForAncestor:(RNSharedElementTransitionItem*) ancestor;

@end

#endif
