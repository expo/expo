//
//  ABI47_0_0RNSharedElementNodeManager.h
//  ABI47_0_0React-native-shared-element
//

#ifndef ABI47_0_0RNSharedElementNodeManager_h
#define ABI47_0_0RNSharedElementNodeManager_h

#import "ABI47_0_0RNSharedElementNode.h"

@interface ABI47_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI47_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI47_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI47_0_0RNSharedElementNode*) node;

@end

#endif
