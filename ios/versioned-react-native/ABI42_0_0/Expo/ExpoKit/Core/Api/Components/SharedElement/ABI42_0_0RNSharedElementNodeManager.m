//
//  ABI42_0_0RCTMagicMoveCloneDataManager.m
//  ABI42_0_0React-native-shared-element
//

#import <UIKit/UIKit.h>
#import "ABI42_0_0RNSharedElementNodeManager.h"

@implementation ABI42_0_0RNSharedElementNodeManager
{
  NSMutableDictionary* _items;
}

- (instancetype)init
{
  _items = [[NSMutableDictionary alloc]init];
  return self;
}

- (ABI42_0_0RNSharedElementNode*) acquire:(NSNumber*) ABI42_0_0ReactTag view:(UIView*)view isParent:(BOOL)isParent
{
  @synchronized(_items)
  {
    ABI42_0_0RNSharedElementNode* node = [_items objectForKey:ABI42_0_0ReactTag];
    if (node != nil) {
      node.refCount = node.refCount + 1;
      return node;
    }
    node = [[ABI42_0_0RNSharedElementNode alloc]init:ABI42_0_0ReactTag view:view isParent:isParent];
    [_items setObject:node forKey:ABI42_0_0ReactTag];
    return node;
  }
}

- (long) release:(ABI42_0_0RNSharedElementNode*) node
{
  @synchronized(_items)
  {
    node.refCount = node.refCount - 1;
    if (node.refCount == 0) {
      ABI42_0_0RNSharedElementNode* dictItem = [_items objectForKey:node.ABI42_0_0ReactTag];
      if (dictItem == node) {
        [_items removeObjectForKey:node.ABI42_0_0ReactTag];
      }
    }
    return node.refCount;
  }
}

@end
