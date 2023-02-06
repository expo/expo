//
//  ABI48_0_0RNSharedElementNode.h
//  ABI48_0_0React-native-shared-element
//

#ifndef ABI48_0_0RNSharedElementNode_h
#define ABI48_0_0RNSharedElementNode_h

#import "ABI48_0_0RNSharedElementDelegate.h"

@interface ABI48_0_0RNSharedElementNode : NSObject

@property (nonatomic, readonly) NSNumber* ABI48_0_0ReactTag;
@property (nonatomic, readonly) BOOL isParent;
@property (nonatomic) long refCount;
@property (nonatomic) long hideRefCount;

- (instancetype)init:(NSNumber *)ABI48_0_0ReactTag view:(UIView*) view isParent:(BOOL)isParent;

- (void) requestContent:(id <ABI48_0_0RNSharedElementDelegate>) delegate;
- (void) requestStyle:(id <ABI48_0_0RNSharedElementDelegate>) delegate;
- (void) cancelRequests:(id <ABI48_0_0RNSharedElementDelegate>) delegate;

+ (void) setImageResolvers:(NSArray*) imageResolvers;

@end

#endif
