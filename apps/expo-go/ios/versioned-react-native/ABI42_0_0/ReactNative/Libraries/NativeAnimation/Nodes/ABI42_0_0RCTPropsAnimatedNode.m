/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTPropsAnimatedNode.h>

#import <ABI42_0_0React/ABI42_0_0RCTLog.h>
#import <ABI42_0_0React/ABI42_0_0RCTSurfacePresenterStub.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>

#import <ABI42_0_0React/ABI42_0_0RCTAnimationUtils.h>
#import <ABI42_0_0React/ABI42_0_0RCTStyleAnimatedNode.h>
#import <ABI42_0_0React/ABI42_0_0RCTValueAnimatedNode.h>



@implementation ABI42_0_0RCTPropsAnimatedNode
{
  NSNumber *_connectedViewTag;
  NSNumber *_rootTag;
  NSString *_connectedViewName;
  __weak ABI42_0_0RCTBridge *_bridge;
  NSMutableDictionary<NSString *, NSObject *> *_propsDictionary; // TODO: use RawProps or folly::dynamic directly
  BOOL _managedByFabric;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if (self = [super initWithTag:tag config:config]) {
    _propsDictionary = [NSMutableDictionary new];
  }
  return self;
}

- (BOOL)isManagedByFabric
{
  return _managedByFabric;
}

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
               bridge:(ABI42_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  _connectedViewTag = viewTag;
  _connectedViewName = viewName;
  _managedByFabric = ABI42_0_0RCTUIManagerTypeForTagIsFabric(viewTag);
  _rootTag = nil;
}

- (void)disconnectFromView:(NSNumber *)viewTag
{
  _bridge = nil;
  _connectedViewTag = nil;
  _connectedViewName = nil;
  _managedByFabric = NO;
  _rootTag = nil;
}

- (void)updateView
{
  if (_managedByFabric) {
    [_bridge.surfacePresenter synchronouslyUpdateViewOnUIThread:_connectedViewTag
                                                          props:_propsDictionary];
  } else {
    [_bridge.uiManager synchronouslyUpdateViewOnUIThread:_connectedViewTag
                                                viewName:_connectedViewName
                                                   props:_propsDictionary];
  }
}

- (void)restoreDefaultValues
{
  // Restore the default value for all props that were modified by this node.
  for (NSString *key in _propsDictionary.allKeys) {
    _propsDictionary[key] = [NSNull null];
  }

  if (_propsDictionary.count) {
    [self updateView];
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

  for (NSNumber *parentTag in self.parentNodes.keyEnumerator) {
    ABI42_0_0RCTAnimatedNode *parentNode = [self.parentNodes objectForKey:parentTag];
    if ([parentNode isKindOfClass:[ABI42_0_0RCTStyleAnimatedNode class]]) {
      [self->_propsDictionary addEntriesFromDictionary:[(ABI42_0_0RCTStyleAnimatedNode *)parentNode propsDictionary]];

    } else if ([parentNode isKindOfClass:[ABI42_0_0RCTValueAnimatedNode class]]) {
      NSString *property = [self propertyNameForParentTag:parentTag];
      id animatedObject = [(ABI42_0_0RCTValueAnimatedNode *)parentNode animatedObject];
      if (animatedObject) {
        self->_propsDictionary[property] = animatedObject;
      } else {
        CGFloat value = [(ABI42_0_0RCTValueAnimatedNode *)parentNode value];
        self->_propsDictionary[property] = @(value);
      }
    }
  }

  if (_propsDictionary.count) {
    [self updateView];
  }
}

@end
