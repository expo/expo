//
//  ABI37_0_0RNSharedElementNodeManager.h
//  ABI37_0_0React-native-shared-element
//

#ifndef ABI37_0_0RNSharedElementNodeManager_h
#define ABI37_0_0RNSharedElementNodeManager_h

#import "ABI37_0_0RNSharedElementNode.h"

@interface ABI37_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI37_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI37_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI37_0_0RNSharedElementNode*) node;

@end

#endif
