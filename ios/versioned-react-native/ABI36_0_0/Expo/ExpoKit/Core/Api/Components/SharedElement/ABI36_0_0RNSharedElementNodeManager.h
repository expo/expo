//
//  ABI36_0_0RNSharedElementNodeManager.h
//  ABI36_0_0React-native-shared-element
//

#ifndef ABI36_0_0RNSharedElementNodeManager_h
#define ABI36_0_0RNSharedElementNodeManager_h

#import "ABI36_0_0RNSharedElementNode.h"

@interface ABI36_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI36_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI36_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI36_0_0RNSharedElementNode*) node;

@end

#endif
