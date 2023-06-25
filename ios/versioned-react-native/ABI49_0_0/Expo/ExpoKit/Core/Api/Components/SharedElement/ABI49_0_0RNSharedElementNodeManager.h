//
//  ABI49_0_0RNSharedElementNodeManager.h
//  ABI49_0_0React-native-shared-element
//

#ifndef ABI49_0_0RNSharedElementNodeManager_h
#define ABI49_0_0RNSharedElementNodeManager_h

#import "ABI49_0_0RNSharedElementNode.h"

@interface ABI49_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI49_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI49_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI49_0_0RNSharedElementNode*) node;

@end

#endif
