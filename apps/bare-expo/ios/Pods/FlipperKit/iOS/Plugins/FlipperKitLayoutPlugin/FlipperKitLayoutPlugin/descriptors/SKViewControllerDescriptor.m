/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "SKViewControllerDescriptor.h"

#import "SKDescriptorMapper.h"

@implementation SKViewControllerDescriptor

- (NSString*)identifierForNode:(UIViewController*)node {
  return [NSString stringWithFormat:@"%p", node];
}

- (NSUInteger)childCountForNode:(UIViewController*)node {
  return 1;
}

- (id)childForNode:(UIViewController*)node atIndex:(NSUInteger)index {
  return node.view;
}

- (void)setHighlightedForNode:(UIViewController*)node {
}

- (NSArray<SKNamed<NSString*>*>*)attributesForNode:(UIViewController*)node {
  return @[ [SKNamed newWithName:@"addr"
                       withValue:[NSString stringWithFormat:@"%p", node]] ];
}

- (void)setHighlighted:(BOOL)highlighted forNode:(UIViewController*)node {
  SKNodeDescriptor* descriptor = [self descriptorForClass:[UIView class]];
  [descriptor setHighlighted:highlighted forNode:node.view];
}

- (void)hitTest:(SKTouch*)touch forNode:(UIViewController*)node {
  [touch continueWithChildIndex:0 withOffset:(CGPoint){0, 0}];
}

@end

#endif
