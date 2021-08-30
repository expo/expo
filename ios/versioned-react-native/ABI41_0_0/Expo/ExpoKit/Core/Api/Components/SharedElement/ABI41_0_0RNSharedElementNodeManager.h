//
//  ABI41_0_0RNSharedElementNodeManager.h
//  ABI41_0_0React-native-shared-element
//

#ifndef ABI41_0_0RNSharedElementNodeManager_h
#define ABI41_0_0RNSharedElementNodeManager_h

#import "ABI41_0_0RNSharedElementNode.h"

@interface ABI41_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI41_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI41_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI41_0_0RNSharedElementNode*) node;

@end

#endif
