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
@property (nonatomic, assign) id content;
@property (nonatomic, assign) RNSharedElementContentType contentType;
@property (nonatomic, readonly) NSString* contentTypeName;

- (instancetype)initWithNodeManager:(RNSharedElementNodeManager*)nodeManager name:(NSString*)name isAncestor:(BOOL)isAncestor;

- (CGRect) contentLayoutForContent:(id)content contentType:(RNSharedElementContentType)contentType;
- (CGRect) visibleLayoutForAncestor:(RNSharedElementTransitionItem*) ancestor;

+ (CGSize) contentSizeFor:(CGRect)layout content:(id)content contentType:(RNSharedElementContentType)contentType;
+ (CGRect) contentLayoutFor:(CGRect)layout content:(id)content contentType:(RNSharedElementContentType)contentType contentMode:(UIViewContentMode) contentMode reverse:(BOOL)reverse;

@end

#endif
