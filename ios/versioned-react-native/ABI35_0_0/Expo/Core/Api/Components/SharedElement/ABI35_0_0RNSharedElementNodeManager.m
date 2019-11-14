//
//  ABI35_0_0RCTMagicMoveCloneDataManager.m
//  ReactABI35_0_0-native-shared-element
//

#import <UIKit/UIKit.h>
#import "ABI35_0_0RNSharedElementNodeManager.h"

@implementation ABI35_0_0RNSharedElementNodeManager
{
  NSMutableDictionary* _items;
}

- (instancetype)init
{
  _items = [[NSMutableDictionary alloc]init];
  return self;
}

- (ABI35_0_0RNSharedElementNode*) acquire:(NSNumber*) ReactABI35_0_0Tag view:(UIView*)view isParent:(BOOL)isParent
{
  @synchronized(_items)
  {
    ABI35_0_0RNSharedElementNode* node = [_items objectForKey:ReactABI35_0_0Tag];
    if (node != nil) {
      node.refCount = node.refCount + 1;
      return node;
    }
      node = [[ABI35_0_0RNSharedElementNode alloc]init:ReactABI35_0_0Tag view:view isParent:isParent];
    [_items setObject:node forKey:ReactABI35_0_0Tag];
    return node;
  }
}

- (long) release:(ABI35_0_0RNSharedElementNode*) node
{
  @synchronized(_items)
  {
    node.refCount = node.refCount - 1;
    if (node.refCount == 0) {
      ABI35_0_0RNSharedElementNode* dictItem = [_items objectForKey:node.ReactABI35_0_0Tag];
      if (dictItem == node) {
        [_items removeObjectForKey:node.ReactABI35_0_0Tag];
      }
    }
    return node.refCount;
  }
}

@end
