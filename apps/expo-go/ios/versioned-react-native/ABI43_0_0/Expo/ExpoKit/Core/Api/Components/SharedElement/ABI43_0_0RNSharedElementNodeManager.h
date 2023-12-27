//
//  ABI43_0_0RNSharedElementNodeManager.h
//  ABI43_0_0React-native-shared-element
//

#ifndef ABI43_0_0RNSharedElementNodeManager_h
#define ABI43_0_0RNSharedElementNodeManager_h

#import "ABI43_0_0RNSharedElementNode.h"

@interface ABI43_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI43_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI43_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI43_0_0RNSharedElementNode*) node;

@end

#endif
