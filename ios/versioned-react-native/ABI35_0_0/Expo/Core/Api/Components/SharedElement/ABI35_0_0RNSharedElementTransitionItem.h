//
//  ABI35_0_0RNSharedElementTransition.h
//  ReactABI35_0_0-native-shared-element
//

#ifndef ABI35_0_0RNSharedElementTransitionItem_h
#define ABI35_0_0RNSharedElementTransitionItem_h

#import "ABI35_0_0RNSharedElementNodeManager.h"

@interface ABI35_0_0RNSharedElementTransitionItem : NSObject

@property (nonatomic, readonly) ABI35_0_0RNSharedElementNodeManager* nodeManager;
@property (nonatomic, readonly) BOOL isAncestor;
@property (nonatomic, readonly) NSString* name;
@property (nonatomic, assign) ABI35_0_0RNSharedElementNode* node;
@property (nonatomic, assign) BOOL hidden;
@property (nonatomic, assign) BOOL needsLayout;
@property (nonatomic, assign) BOOL needsContent;
@property (nonatomic, assign) BOOL hasCalledOnMeasure;
@property (nonatomic, assign) ABI35_0_0RNSharedElementStyle* style;
@property (nonatomic, assign) id content;
@property (nonatomic, assign) ABI35_0_0RNSharedElementContentType contentType;
@property (nonatomic, readonly) NSString* contentTypeName;

- (instancetype)initWithNodeManager:(ABI35_0_0RNSharedElementNodeManager*)nodeManager name:(NSString*)name isAncestor:(BOOL)isAncestor;

- (CGRect) contentLayoutForContent:(id)content contentType:(ABI35_0_0RNSharedElementContentType)contentType;
- (CGRect) visibleLayoutForAncestor:(ABI35_0_0RNSharedElementTransitionItem*) ancestor;

+ (CGSize) contentSizeFor:(CGRect)layout content:(id)content contentType:(ABI35_0_0RNSharedElementContentType)contentType;
+ (CGRect) contentLayoutFor:(CGRect)layout content:(id)content contentType:(ABI35_0_0RNSharedElementContentType)contentType contentMode:(UIViewContentMode) contentMode reverse:(BOOL)reverse;

@end

#endif
