//
//  RNSharedElementNodeManager.h
//  react-native-shared-element
//

#ifndef RNSharedElementNodeManager_h
#define RNSharedElementNodeManager_h

#import "RNSharedElementNode.h"

@interface RNSharedElementNodeManager : NSObject

- (instancetype)init;
- (RNSharedElementNode*) acquire:(NSNumber*) reactTag view:(UIView*)view isParent:(BOOL)isParent;
- (long) release:(RNSharedElementNode*) node;

@end

#endif
