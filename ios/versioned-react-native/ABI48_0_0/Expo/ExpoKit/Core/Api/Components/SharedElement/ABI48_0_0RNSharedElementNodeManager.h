//
//  ABI48_0_0RNSharedElementNodeManager.h
//  ABI48_0_0React-native-shared-element
//

#ifndef ABI48_0_0RNSharedElementNodeManager_h
#define ABI48_0_0RNSharedElementNodeManager_h

#import "ABI48_0_0RNSharedElementNode.h"

@interface ABI48_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI48_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI48_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI48_0_0RNSharedElementNode*) node;

@end

#endif
