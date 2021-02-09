//
//  RCTMagicMoveCloneDataManager.m
//  react-native-shared-element
//

#import <UIKit/UIKit.h>
#import "RNSharedElementNodeManager.h"

@implementation RNSharedElementNodeManager
{
  NSMutableDictionary* _items;
}

- (instancetype)init
{
  _items = [[NSMutableDictionary alloc]init];
  return self;
}

- (RNSharedElementNode*) acquire:(NSNumber*) reactTag view:(UIView*)view isParent:(BOOL)isParent
{
  @synchronized(_items)
  {
    RNSharedElementNode* node = [_items objectForKey:reactTag];
    if (node != nil) {
      node.refCount = node.refCount + 1;
      return node;
    }
    node = [[RNSharedElementNode alloc]init:reactTag view:view isParent:isParent];
    [_items setObject:node forKey:reactTag];
    return node;
  }
}

- (long) release:(RNSharedElementNode*) node
{
  @synchronized(_items)
  {
    node.refCount = node.refCount - 1;
    if (node.refCount == 0) {
      RNSharedElementNode* dictItem = [_items objectForKey:node.reactTag];
      if (dictItem == node) {
        [_items removeObjectForKey:node.reactTag];
      }
    }
    return node.refCount;
  }
}

@end
