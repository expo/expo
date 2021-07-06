//
//  ABI40_0_0RNSharedElementNode.h
//  ABI40_0_0React-native-shared-element
//

#ifndef ABI40_0_0RNSharedElementNode_h
#define ABI40_0_0RNSharedElementNode_h

#import "ABI40_0_0RNSharedElementDelegate.h"

@interface ABI40_0_0RNSharedElementNode : NSObject

@property (nonatomic, readonly) NSNumber* ABI40_0_0ReactTag;
@property (nonatomic, readonly) BOOL isParent;
@property (nonatomic) long refCount;
@property (nonatomic) long hideRefCount;

- (instancetype)init:(NSNumber *)ABI40_0_0ReactTag view:(UIView*) view isParent:(BOOL)isParent;

- (void) requestContent:(id <ABI40_0_0RNSharedElementDelegate>) delegate;
- (void) requestStyle:(id <ABI40_0_0RNSharedElementDelegate>) delegate;
- (void) cancelRequests:(id <ABI40_0_0RNSharedElementDelegate>) delegate;

+ (void) setImageResolvers:(NSArray*) imageResolvers;

@end

#endif
