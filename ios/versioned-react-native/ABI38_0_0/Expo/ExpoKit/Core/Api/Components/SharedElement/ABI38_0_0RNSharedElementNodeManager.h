//
//  ABI38_0_0RNSharedElementNodeManager.h
//  ABI38_0_0React-native-shared-element
//

#ifndef ABI38_0_0RNSharedElementNodeManager_h
#define ABI38_0_0RNSharedElementNodeManager_h

#import "ABI38_0_0RNSharedElementNode.h"

@interface ABI38_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI38_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI38_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI38_0_0RNSharedElementNode*) node;

@end

#endif
