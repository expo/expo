//
//  ABI35_0_0RNSharedElementNode.h
//  ReactABI35_0_0-native-shared-element
//

#ifndef ABI35_0_0RNSharedElementNode_h
#define ABI35_0_0RNSharedElementNode_h

#import "ABI35_0_0RNSharedElementDelegate.h"

@interface ABI35_0_0RNSharedElementNode : NSObject

@property (nonatomic, readonly) NSNumber* ReactABI35_0_0Tag;
@property (nonatomic, readonly) BOOL isParent;
@property (nonatomic) long refCount;
@property (nonatomic) long hideRefCount;

- (instancetype)init:(NSNumber *)ReactABI35_0_0Tag view:(UIView*) view isParent:(BOOL)isParent;

- (void) requestContent:(id <ABI35_0_0RNSharedElementDelegate>) delegate;
- (void) requestStyle:(id <ABI35_0_0RNSharedElementDelegate>) delegate;
- (void) cancelRequests:(id <ABI35_0_0RNSharedElementDelegate>) delegate;

+ (void) setImageResolvers:(NSArray*) imageResolvers;

@end

#endif
