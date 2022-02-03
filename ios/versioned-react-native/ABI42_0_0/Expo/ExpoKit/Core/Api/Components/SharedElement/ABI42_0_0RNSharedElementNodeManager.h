//
//  ABI42_0_0RNSharedElementNodeManager.h
//  ABI42_0_0React-native-shared-element
//

#ifndef ABI42_0_0RNSharedElementNodeManager_h
#define ABI42_0_0RNSharedElementNodeManager_h

#import "ABI42_0_0RNSharedElementNode.h"

@interface ABI42_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI42_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI42_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI42_0_0RNSharedElementNode*) node;

@end

#endif
