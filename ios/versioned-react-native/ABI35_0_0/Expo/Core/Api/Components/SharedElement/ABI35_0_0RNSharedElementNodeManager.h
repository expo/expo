//
//  ABI35_0_0RNSharedElementNodeManager.h
//  ReactABI35_0_0-native-shared-element
//

#ifndef ABI35_0_0RNSharedElementNodeManager_h
#define ABI35_0_0RNSharedElementNodeManager_h

#import "ABI35_0_0RNSharedElementNode.h"

@interface ABI35_0_0RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (ABI35_0_0RNSharedElementNode*) acquire:(NSNumber*) ReactABI35_0_0Tag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(ABI35_0_0RNSharedElementNode*) node;

@end

#endif
