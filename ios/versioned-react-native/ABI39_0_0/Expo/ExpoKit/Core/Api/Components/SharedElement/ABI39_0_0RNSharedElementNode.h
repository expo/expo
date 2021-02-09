//
//  ABI39_0_0RNSharedElementNode.h
//  ABI39_0_0React-native-shared-element
//

#ifndef ABI39_0_0RNSharedElementNode_h
#define ABI39_0_0RNSharedElementNode_h

#import "ABI39_0_0RNSharedElementDelegate.h"

@interface ABI39_0_0RNSharedElementNode : NSObject

@property (nonatomic, readonly) NSNumber* ABI39_0_0ReactTag;
@property (nonatomic, readonly) BOOL isParent;
@property (nonatomic) long refCount;
@property (nonatomic) long hideRefCount;

- (instancetype)init:(NSNumber *)ABI39_0_0ReactTag view:(UIView*) view isParent:(BOOL)isParent;

- (void) requestContent:(id <ABI39_0_0RNSharedElementDelegate>) delegate;
- (void) requestStyle:(id <ABI39_0_0RNSharedElementDelegate>) delegate;
- (void) cancelRequests:(id <ABI39_0_0RNSharedElementDelegate>) delegate;

+ (void) setImageResolvers:(NSArray*) imageResolvers;

@end

#endif
