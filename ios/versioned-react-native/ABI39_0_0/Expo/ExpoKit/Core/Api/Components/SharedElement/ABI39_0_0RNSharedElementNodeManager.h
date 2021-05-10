//
//  ABI39_0_0RNSharedElementNodeManager.h
//  ABI39_0_0React-native-shared-element
//

#ifndef ABI39_0_0RNSharedElementNodeManager_h
#define ABI39_0_0RNSharedElementNodeManager_h

#import "ABI39_0_0RNSharedElementNode.h"

@interface ABI39_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI39_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI39_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI39_0_0RNSharedElementNode*) node;

@end

#endif
