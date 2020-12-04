/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "SKTouch.h"
#import "SKNodeDescriptor.h"

@implementation SKTouch {
  SKTouchFinishDelegate _onFinish;

  CGPoint _currentTouchPoint;

  SKDescriptorMapper* _descriptorMapper;

  NSMutableArray<id<NSObject>>* _nodeStack;
  NSMutableArray<NSMutableDictionary*>* _treeStack;
}

- (instancetype)initWithTouchPoint:(CGPoint)touchPoint
                      withRootNode:(id<NSObject>)node
              withDescriptorMapper:(SKDescriptorMapper*)mapper
                   finishWithBlock:(SKTouchFinishDelegate)finishBlock {
  if (self = [super init]) {
    _onFinish = finishBlock;
    _currentTouchPoint = touchPoint;
    _descriptorMapper = mapper;
    _nodeStack = [NSMutableArray new];
    [_nodeStack addObject:node];
    _treeStack = [NSMutableArray new];
    [_treeStack addObject:[[NSMutableDictionary alloc] init]];
  }

  return self;
}

- (void)continueWithChildIndex:(NSUInteger)childIndex
                    withOffset:(CGPoint)offset {
  _currentTouchPoint.x -= offset.x;
  _currentTouchPoint.y -= offset.y;

  id<NSObject> currentNode = _nodeStack.lastObject;
  SKNodeDescriptor* descriptor =
      [_descriptorMapper descriptorForClass:[currentNode class]];
  id<NSObject> nextNode = [descriptor childForNode:currentNode
                                           atIndex:childIndex];
  [_nodeStack addObject:nextNode];
  [_treeStack addObject:[[NSMutableDictionary alloc] init]];

  descriptor = [_descriptorMapper descriptorForClass:[nextNode class]];
  NSString* currentId = [descriptor identifierForNode:nextNode];
  [descriptor hitTest:self forNode:nextNode];

  // After finish this component
  _currentTouchPoint.x += offset.x;
  _currentTouchPoint.y += offset.y;
  [_nodeStack removeLastObject];
  NSDictionary* currentDict = _treeStack.lastObject;
  [_treeStack removeLastObject];
  [_treeStack.lastObject setObject:currentDict forKey:currentId];
}

- (void)finish {
  _onFinish(_nodeStack.lastObject);
}

- (void)retrieveSelectTree:(SKProcessFinishDelegate)callback {
  callback(_treeStack.lastObject);
  [_treeStack removeAllObjects];
}

- (BOOL)containedIn:(CGRect)bounds {
  return CGRectContainsPoint(bounds, _currentTouchPoint);
}

@end

#endif
