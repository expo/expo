/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "SKScrollViewDescriptor.h"

#import "SKDescriptorMapper.h"

@implementation SKScrollViewDescriptor

- (NSString*)identifierForNode:(UIScrollView*)node {
  SKNodeDescriptor* descriptor = [self descriptorForClass:[UIView class]];
  return [descriptor identifierForNode:node];
}

- (NSUInteger)childCountForNode:(UIScrollView*)node {
  SKNodeDescriptor* descriptor = [self descriptorForClass:[UIView class]];
  return [descriptor childCountForNode:node];
}

- (id)childForNode:(UIScrollView*)node atIndex:(NSUInteger)index {
  SKNodeDescriptor* descriptor = [self descriptorForClass:[UIView class]];
  return [descriptor childForNode:node atIndex:index];
}

- (id)dataForNode:(UIScrollView*)node {
  SKNodeDescriptor* descriptor = [self descriptorForClass:[UIView class]];
  return [descriptor dataForNode:node];
}

- (id)dataMutationsForNode:(UIScrollView*)node {
  SKNodeDescriptor* descriptor = [self descriptorForClass:[UIView class]];
  return [descriptor dataMutationsForNode:node];
}

- (NSArray<SKNamed<NSString*>*>*)attributesForNode:(UIScrollView*)node {
  SKNodeDescriptor* descriptor = [self descriptorForClass:[UIView class]];
  return [descriptor attributesForNode:node];
}

- (void)setHighlighted:(BOOL)highlighted forNode:(UIScrollView*)node {
  SKNodeDescriptor* descriptor = [self descriptorForClass:[UIView class]];
  [descriptor setHighlighted:highlighted forNode:node];
}

- (void)hitTest:(SKTouch*)touch forNode:(UIScrollView*)node {
  bool finish = true;
  for (NSInteger index = [self childCountForNode:node] - 1; index >= 0;
       index--) {
    id<NSObject> childNode = [self childForNode:node atIndex:index];
    CGRect frame;

    if ([childNode isKindOfClass:[UIViewController class]]) {
      UIViewController* child = (UIViewController*)childNode;
      if (child.view.isHidden) {
        continue;
      }

      frame = child.view.frame;
    } else {
      UIView* child = (UIView*)childNode;
      if (child.isHidden) {
        continue;
      }

      frame = child.frame;
    }

    frame.origin.x -= node.contentOffset.x;
    frame.origin.y -= node.contentOffset.y;

    if ([touch containedIn:frame]) {
      [touch continueWithChildIndex:index withOffset:frame.origin];
      finish = false;
    }
  }

  if (finish) {
    [touch finish];
  }
}

@end

#endif
