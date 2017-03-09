/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI15_0_0RCTPropsAnimatedNode.h"

#import <ReactABI15_0_0/ABI15_0_0RCTLog.h>
#import <ReactABI15_0_0/ABI15_0_0RCTUIManager.h>

#import "ABI15_0_0RCTAnimationUtils.h"
#import "ABI15_0_0RCTStyleAnimatedNode.h"
#import "ABI15_0_0RCTValueAnimatedNode.h"

@implementation ABI15_0_0RCTPropsAnimatedNode {
  NSNumber *_connectedViewTag;
  NSString *_connectedViewName;
  ABI15_0_0RCTUIManager *_uiManager;
}

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
            uiManager:(ABI15_0_0RCTUIManager *)uiManager
{
  _connectedViewTag = viewTag;
  _connectedViewName = viewName;
  _uiManager = uiManager;
}

- (void)disconnectFromView:(NSNumber *)viewTag
{
  _connectedViewTag = nil;
  _connectedViewName = nil;
  _uiManager = nil;
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

- (void)performUpdate
{
  [super performUpdate];

  if (!_connectedViewTag) {
    ABI15_0_0RCTLogError(@"Node has not been attached to a view");
    return;
  }

  NSMutableDictionary *props = [NSMutableDictionary dictionary];
  [self.parentNodes enumerateKeysAndObjectsUsingBlock:^(NSNumber * _Nonnull parentTag, ABI15_0_0RCTAnimatedNode * _Nonnull parentNode, BOOL * _Nonnull stop) {

    if ([parentNode isKindOfClass:[ABI15_0_0RCTStyleAnimatedNode class]]) {
      [props addEntriesFromDictionary:[(ABI15_0_0RCTStyleAnimatedNode *)parentNode propsDictionary]];

    } else if ([parentNode isKindOfClass:[ABI15_0_0RCTValueAnimatedNode class]]) {
      NSString *property = [self propertyNameForParentTag:parentTag];
      CGFloat value = [(ABI15_0_0RCTValueAnimatedNode *)parentNode value];
      [props setObject:@(value) forKey:property];
    }

  }];

  if (props.count) {
    [_uiManager synchronouslyUpdateViewOnUIThread:_connectedViewTag
                                         viewName:_connectedViewName
                                            props:props];
  }
}

@end
