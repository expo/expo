/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTPropsAnimatedNode.h>

#import <ABI43_0_0React/ABI43_0_0RCTAnimationUtils.h>
#import <ABI43_0_0React/ABI43_0_0RCTLog.h>
#import <ABI43_0_0React/ABI43_0_0RCTStyleAnimatedNode.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import <ABI43_0_0React/ABI43_0_0RCTValueAnimatedNode.h>

@implementation ABI43_0_0RCTPropsAnimatedNode
{
  NSNumber *_connectedViewTag;
  NSNumber *_rootTag;
  NSString *_connectedViewName;
  __weak ABI43_0_0RCTBridge *_bridge;
  __weak id<ABI43_0_0RCTSurfacePresenterStub> _surfacePresenter;
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
               bridge:(ABI43_0_0RCTBridge *)bridge
     surfacePresenter:(id<ABI43_0_0RCTSurfacePresenterStub> )surfacePresenter
{
  _bridge = bridge;
  _surfacePresenter = surfacePresenter;
  _connectedViewTag = viewTag;
  _connectedViewName = viewName;
  _managedByFabric = ABI43_0_0RCTUIManagerTypeForTagIsFabric(viewTag);
  _rootTag = nil;
}

- (void)disconnectFromView:(NSNumber *)viewTag
{
  _bridge = nil;
  _surfacePresenter = nil;
  _connectedViewTag = nil;
  _connectedViewName = nil;
  _managedByFabric = NO;
  _rootTag = nil;
}

- (void)updateView
{
  if (_managedByFabric) {
    if (_bridge.surfacePresenter) {
      [_bridge.surfacePresenter synchronouslyUpdateViewOnUIThread:_connectedViewTag
      props:_propsDictionary];
    } else {
      [_surfacePresenter synchronouslyUpdateViewOnUIThread:_connectedViewTag
      props:_propsDictionary];
    }
  } else {
    [_bridge.uiManager synchronouslyUpdateViewOnUIThread:_connectedViewTag
                                                viewName:_connectedViewName
                                                   props:_propsDictionary];
  }
}

- (void)restoreDefaultValues
{
  if (_managedByFabric) {
    // Restoring to default values causes render of inconsistent state
    // to the user because it isn't synchonised with Fabric's UIManager.
    return;
  }
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
    ABI43_0_0RCTAnimatedNode *parentNode = [self.parentNodes objectForKey:parentTag];
    if ([parentNode isKindOfClass:[ABI43_0_0RCTStyleAnimatedNode class]]) {
      [self->_propsDictionary addEntriesFromDictionary:[(ABI43_0_0RCTStyleAnimatedNode *)parentNode propsDictionary]];

    } else if ([parentNode isKindOfClass:[ABI43_0_0RCTValueAnimatedNode class]]) {
      NSString *property = [self propertyNameForParentTag:parentTag];
      id animatedObject = [(ABI43_0_0RCTValueAnimatedNode *)parentNode animatedObject];
      if (animatedObject) {
        self->_propsDictionary[property] = animatedObject;
      } else {
        CGFloat value = [(ABI43_0_0RCTValueAnimatedNode *)parentNode value];
        self->_propsDictionary[property] = @(value);
      }
    }
  }

  if (_propsDictionary.count) {
    [self updateView];
  }
}

@end
