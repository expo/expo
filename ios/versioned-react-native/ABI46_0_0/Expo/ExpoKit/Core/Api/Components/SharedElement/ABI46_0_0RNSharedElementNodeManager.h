//
//  ABI46_0_0RNSharedElementNodeManager.h
//  ABI46_0_0React-native-shared-element
//

#ifndef ABI46_0_0RNSharedElementNodeManager_h
#define ABI46_0_0RNSharedElementNodeManager_h

#import "ABI46_0_0RNSharedElementNode.h"

@interface ABI46_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI46_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI46_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI46_0_0RNSharedElementNode*) node;

@end

#endif
