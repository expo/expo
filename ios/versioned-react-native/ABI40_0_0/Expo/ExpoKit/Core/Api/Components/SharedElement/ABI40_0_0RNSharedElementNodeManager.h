//
//  ABI40_0_0RNSharedElementNodeManager.h
//  ABI40_0_0React-native-shared-element
//

#ifndef ABI40_0_0RNSharedElementNodeManager_h
#define ABI40_0_0RNSharedElementNodeManager_h

#import "ABI40_0_0RNSharedElementNode.h"

@interface ABI40_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI40_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI40_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI40_0_0RNSharedElementNode*) node;

@end

#endif
