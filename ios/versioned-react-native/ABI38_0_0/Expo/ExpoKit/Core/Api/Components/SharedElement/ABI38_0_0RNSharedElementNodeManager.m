//
//  ABI38_0_0RCTMagicMoveCloneDataManager.m
//  ABI38_0_0React-native-shared-element
//

#import <UIKit/UIKit.h>
#import "ABI38_0_0RNSharedElementNodeManager.h"

@implementation ABI38_0_0RNSharedElementNodeManager
{
  NSMutableDictionary* _items;
}

- (instancetype)init
{
  _items = [[NSMutableDictionary alloc]init];
  return self;
}

- (ABI38_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI38_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent
{
  @synchronized(_items)
  {
    ABI38_0_0RNSharedElementNode* node = [_items objectForKey:ABI38_0_0ReactTag];
    if (node != nil) {
      node.refCount = node.refCount + 1;
      return node;
    }
    node = [[ABI38_0_0RNSharedElementNode alloc]init:ABI38_0_0ReactTag view:view isParent:isParent];
    [_items setObject:node forKey:ABI38_0_0ReactTag];
    return node;
  }
}

- (long) release:(ABI38_0_0RNSharedElementNode*) node
{
  @synchronized(_items)
  {
    node.refCount = node.refCount - 1;
    if (node.refCount == 0) {
      ABI38_0_0RNSharedElementNode* dictItem = [_items objectForKey:node.ABI38_0_0ReactTag];
      if (dictItem == node) {
        [_items removeObjectForKey:node.ABI38_0_0ReactTag];
      }
    }
    return node.refCount;
  }
}

@end
