/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTPropsAnimatedNode.h"

#import <ReactABI22_0_0/ABI22_0_0RCTLog.h>
#import <ReactABI22_0_0/ABI22_0_0RCTUIManager.h>

#import "ABI22_0_0RCTAnimationUtils.h"
#import "ABI22_0_0RCTStyleAnimatedNode.h"
#import "ABI22_0_0RCTValueAnimatedNode.h"

@implementation ABI22_0_0RCTPropsAnimatedNode
{
  NSNumber *_connectedViewTag;
  NSString *_connectedViewName;
  ABI22_0_0RCTUIManager *_uiManager;
  NSMutableDictionary<NSString *, NSObject *> *_propsDictionary;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config;
{
  if (self = [super initWithTag:tag config:config]) {
    _propsDictionary = [NSMutableDictionary new];
  }
  return self;
}

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
            uiManager:(ABI22_0_0RCTUIManager *)uiManager
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

- (void)restoreDefaultValues
{
  // Restore the default value for all props that were modified by this node.
  for (NSString *key in _propsDictionary.allKeys) {
    _propsDictionary[key] = [NSNull null];
  }

  if (_propsDictionary.count) {
    [_uiManager synchronouslyUpdateViewOnUIThread:_connectedViewTag
                                         viewName:_connectedViewName
                                            props:_propsDictionary];
  }
}

- (NSString *)propertyNameForParentTag:(NSNumber *)parentTag
{
  __block NSString *propertyName;
  [self.config[@"props"] enumerateKeysAndObjectsUsingBlock:^(NSString *_Nonnull property, NSNumber *_Nonnull tag, BOOL *_Nonnull stop) {
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

  // Since we are updating nodes after detaching them from views there is a time where it's
  // possible that the view was disconnected and still receive an update, this is normal and we can
  // simply skip that update.
  if (!_connectedViewTag) {
    return;
  }

  [self.parentNodes enumerateKeysAndObjectsUsingBlock:^(NSNumber *_Nonnull parentTag, ABI22_0_0RCTAnimatedNode *_Nonnull parentNode, BOOL *_Nonnull stop) {

    if ([parentNode isKindOfClass:[ABI22_0_0RCTStyleAnimatedNode class]]) {
      [self->_propsDictionary addEntriesFromDictionary:[(ABI22_0_0RCTStyleAnimatedNode *)parentNode propsDictionary]];

    } else if ([parentNode isKindOfClass:[ABI22_0_0RCTValueAnimatedNode class]]) {
      NSString *property = [self propertyNameForParentTag:parentTag];
      CGFloat value = [(ABI22_0_0RCTValueAnimatedNode *)parentNode value];
      self->_propsDictionary[property] = @(value);
    }
  }];

  if (_propsDictionary.count) {
    [_uiManager synchronouslyUpdateViewOnUIThread:_connectedViewTag
                                         viewName:_connectedViewName
                                            props:_propsDictionary];
  }
}

@end
