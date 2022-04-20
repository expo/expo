//
//  ABI45_0_0RNSharedElementNodeManager.h
//  ABI45_0_0React-native-shared-element
//

#ifndef ABI45_0_0RNSharedElementNodeManager_h
#define ABI45_0_0RNSharedElementNodeManager_h

#import "ABI45_0_0RNSharedElementNode.h"

@interface ABI45_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI45_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI45_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI45_0_0RNSharedElementNode*) node;

@end

#endif
