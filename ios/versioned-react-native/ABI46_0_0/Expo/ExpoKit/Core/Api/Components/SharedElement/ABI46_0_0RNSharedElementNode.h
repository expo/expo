//
//  ABI46_0_0RNSharedElementNode.h
//  ABI46_0_0React-native-shared-element
//

#ifndef ABI46_0_0RNSharedElementNode_h
#define ABI46_0_0RNSharedElementNode_h

#import "ABI46_0_0RNSharedElementDelegate.h"

@interface ABI46_0_0RNSharedElementNode : NSObject

@property (nonatomic, readonly) NSNumber* ABI46_0_0ReactTag;
@property (nonatomic, readonly) BOOL isParent;
@property (nonatomic) long refCount;
@property (nonatomic) long hideRefCount;

- (instancetype)init:(NSNumber *)ABI46_0_0ReactTag view:(UIView*) view isParent:(BOOL)isParent;

- (void) requestContent:(id <ABI46_0_0RNSharedElementDelegate>) delegate;
- (void) requestStyle:(id <ABI46_0_0RNSharedElementDelegate>) delegate;
- (void) cancelRequests:(id <ABI46_0_0RNSharedElementDelegate>) delegate;

+ (void) setImageResolvers:(NSArray*) imageResolvers;

@end

#endif
