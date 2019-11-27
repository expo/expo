//
//  ABI36_0_0RNSharedElementTransition.h
//  ABI36_0_0React-native-shared-element
//

#ifndef ABI36_0_0RNSharedElementTransitionItem_h
#define ABI36_0_0RNSharedElementTransitionItem_h

#import "ABI36_0_0RNSharedElementNodeManager.h"

@interface ABI36_0_0RNSharedElementTransitionItem : NSObject

@property (nonatomic, readonly) ABI36_0_0RNSharedElementNodeManager* nodeManager;
@property (nonatomic, readonly) BOOL isAncestor;
@property (nonatomic, readonly) NSString* name;
@property (nonatomic, assign) ABI36_0_0RNSharedElementNode* node;
@property (nonatomic, assign) BOOL hidden;
@property (nonatomic, assign) BOOL needsLayout;
@property (nonatomic, assign) BOOL needsContent;
@property (nonatomic, assign) BOOL hasCalledOnMeasure;
@property (nonatomic, assign) ABI36_0_0RNSharedElementStyle* style;
@property (nonatomic, assign) id content;
@property (nonatomic, assign) ABI36_0_0RNSharedElementContentType contentType;
@property (nonatomic, readonly) NSString* contentTypeName;

- (instancetype)initWithNodeManager:(ABI36_0_0RNSharedElementNodeManager*)nodeManager name:(NSString*)name isAncestor:(BOOL)isAncestor;

- (CGRect) contentLayoutForContent:(id)content contentType:(ABI36_0_0RNSharedElementContentType)contentType;
- (CGRect) visibleLayoutForAncestor:(ABI36_0_0RNSharedElementTransitionItem*) ancestor;

+ (CGSize) contentSizeFor:(CGRect)layout content:(id)content contentType:(ABI36_0_0RNSharedElementContentType)contentType;
+ (CGRect) contentLayoutFor:(CGRect)layout content:(id)content contentType:(ABI36_0_0RNSharedElementContentType)contentType contentMode:(UIViewContentMode) contentMode reverse:(BOOL)reverse;

@end

#endif
