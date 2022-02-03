//
//  ABI44_0_0RNSharedElementNodeManager.h
//  ABI44_0_0React-native-shared-element
//

#ifndef ABI44_0_0RNSharedElementNodeManager_h
#define ABI44_0_0RNSharedElementNodeManager_h

#import "ABI44_0_0RNSharedElementNode.h"

@interface ABI44_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI44_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI44_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI44_0_0RNSharedElementNode*) node;

@end

#endif
