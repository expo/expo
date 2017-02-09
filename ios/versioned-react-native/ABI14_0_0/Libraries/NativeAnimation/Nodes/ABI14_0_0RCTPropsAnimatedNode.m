/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0RCTPropsAnimatedNode.h"

#import "ABI14_0_0RCTAnimationUtils.h"
#import "ABI14_0_0RCTStyleAnimatedNode.h"
#import "ABI14_0_0RCTValueAnimatedNode.h"
#import "ABI14_0_0RCTViewPropertyMapper.h"

@implementation ABI14_0_0RCTPropsAnimatedNode

- (void)connectToView:(NSNumber *)viewTag uiManager:(ABI14_0_0RCTUIManager *)uiManager
{
  _propertyMapper = [[ABI14_0_0RCTViewPropertyMapper alloc] initWithViewTag:viewTag uiManager:uiManager];
}

- (void)disconnectFromView:(NSNumber *)viewTag
{
  _propertyMapper = nil;
}

- (void)performUpdate
{
  [super performUpdate];
  [self performViewUpdatesIfNecessary];
}

- (NSString *)propertyNameForParentTag:(NSNumber *)parentTag
{
  __block NSString *propertyName;
  [self.config[@"props"] enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull property, NSNumber * _Nonnull tag, BOOL * _Nonnull stop) {
    if ([tag isEqualToNumber:parentTag]) {
      propertyName = property;
      *stop = YES;
    }
  }];
  return propertyName;
}

- (void)performViewUpdatesIfNecessary
{
  NSMutableDictionary *props = [NSMutableDictionary dictionary];
  [self.parentNodes enumerateKeysAndObjectsUsingBlock:^(NSNumber * _Nonnull parentTag, ABI14_0_0RCTAnimatedNode * _Nonnull parentNode, BOOL * _Nonnull stop) {

    if ([parentNode isKindOfClass:[ABI14_0_0RCTStyleAnimatedNode class]]) {
      [props addEntriesFromDictionary:[(ABI14_0_0RCTStyleAnimatedNode *)parentNode propsDictionary]];

    } else if ([parentNode isKindOfClass:[ABI14_0_0RCTValueAnimatedNode class]]) {
      NSString *property = [self propertyNameForParentTag:parentTag];
      CGFloat value = [(ABI14_0_0RCTValueAnimatedNode *)parentNode value];
      [props setObject:@(value) forKey:property];
    }

  }];

  if (props.count) {
    [_propertyMapper updateViewWithDictionary:props];
  }
}

@end
