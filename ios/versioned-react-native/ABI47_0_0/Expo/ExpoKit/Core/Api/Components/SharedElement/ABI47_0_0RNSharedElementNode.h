//
//  ABI47_0_0RNSharedElementNode.h
//  ABI47_0_0React-native-shared-element
//

#ifndef ABI47_0_0RNSharedElementNode_h
#define ABI47_0_0RNSharedElementNode_h

#import "ABI47_0_0RNSharedElementDelegate.h"

@interface ABI47_0_0RNSharedElementNode : NSObject

@property (nonatomic, readonly) NSNumber* ABI47_0_0ReactTag;
@property (nonatomic, readonly) BOOL isParent;
@property (nonatomic) long refCount;
@property (nonatomic) long hideRefCount;

- (instancetype)init:(NSNumber *)ABI47_0_0ReactTag view:(UIView*) view isParent:(BOOL)isParent;

- (void) requestContent:(id <ABI47_0_0RNSharedElementDelegate>) delegate;
- (void) requestStyle:(id <ABI47_0_0RNSharedElementDelegate>) delegate;
- (void) cancelRequests:(id <ABI47_0_0RNSharedElementDelegate>) delegate;

+ (void) setImageResolvers:(NSArray*) imageResolvers;

@end

#endif
