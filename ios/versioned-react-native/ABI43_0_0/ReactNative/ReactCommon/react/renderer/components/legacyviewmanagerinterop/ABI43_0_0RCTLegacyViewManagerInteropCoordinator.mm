/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0RCTLegacyViewManagerInteropCoordinator.h"
#include <ABI43_0_0React/ABI43_0_0RCTBridge+Private.h>
#include <ABI43_0_0React/ABI43_0_0RCTBridgeMethod.h>
#include <ABI43_0_0React/ABI43_0_0RCTComponentData.h>
#include <ABI43_0_0React/ABI43_0_0RCTEventDispatcherProtocol.h>
#include <ABI43_0_0React/ABI43_0_0RCTFollyConvert.h>
#include <ABI43_0_0React/ABI43_0_0RCTModuleData.h>
#include <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#include <ABI43_0_0React/ABI43_0_0RCTUIManagerUtils.h>
#include <ABI43_0_0React/ABI43_0_0RCTUtils.h>
#include <folly/json.h>

using namespace ABI43_0_0facebook::ABI43_0_0React;

@implementation ABI43_0_0RCTLegacyViewManagerInteropCoordinator {
  ABI43_0_0RCTComponentData *_componentData;
  __weak ABI43_0_0RCTBridge *_bridge;
  /*
   Each instnace of `ABI43_0_0RCTLegacyViewManagerInteropComponentView` registers a block to which events are dispatched.
   This is the container that maps unretained UIView pointer to a block to which the event is dispatched.
   */
  NSMutableDictionary<NSNumber *, InterceptorBlock> *_eventInterceptors;
}

- (instancetype)initWithComponentData:(ABI43_0_0RCTComponentData *)componentData bridge:(ABI43_0_0RCTBridge *)bridge;
{
  if (self = [super init]) {
    _componentData = componentData;
    _bridge = bridge;

    _eventInterceptors = [NSMutableDictionary new];

    __weak __typeof(self) weakSelf = self;
    _componentData.eventInterceptor = ^(NSString *eventName, NSDictionary *event, NSNumber *ABI43_0_0ReactTag) {
      __typeof(self) strongSelf = weakSelf;
      InterceptorBlock block = [strongSelf->_eventInterceptors objectForKey:ABI43_0_0ReactTag];
      if (block) {
        block(std::string([ABI43_0_0RCTNormalizeInputEventName(eventName) UTF8String]), convertIdToFollyDynamic(event ?: @{}));
      }
    };
  }
  return self;
}

- (void)addObserveForTag:(NSInteger)tag usingBlock:(InterceptorBlock)block
{
  [_eventInterceptors setObject:block forKey:[NSNumber numberWithInteger:tag]];
}

- (void)removeObserveForTag:(NSInteger)tag
{
  [_eventInterceptors removeObjectForKey:[NSNumber numberWithInteger:tag]];
}

- (UIView *)paperView
{
  // TODO: pass in the right tags?
  return [_componentData createViewWithTag:NULL rootTag:NULL];
}

- (void)setProps:(folly::dynamic const &)props forView:(UIView *)view
{
  NSDictionary<NSString *, id> *convertedProps = convertFollyDynamicToId(props);
  [_componentData setProps:convertedProps forView:view];
}

- (NSString *)componentViewName
{
  return ABI43_0_0RCTDropABI43_0_0ReactPrefixes(_componentData.name);
}

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args ABI43_0_0ReactTag:(NSInteger)tag
{
  Class managerClass = _componentData.managerClass;
  ABI43_0_0RCTModuleData *moduleData = [_bridge.batchedBridge moduleDataForName:ABI43_0_0RCTBridgeModuleNameForClass(managerClass)];
  id<ABI43_0_0RCTBridgeMethod> method;
  if ([commandName isKindOfClass:[NSNumber class]]) {
    method = moduleData.methods[[commandName intValue]];
  } else if ([commandName isKindOfClass:[NSString class]]) {
    method = moduleData.methodsByName[commandName];
    if (method == nil) {
      ABI43_0_0RCTLogError(@"No command found with name \"%@\"", commandName);
    }
  } else {
    ABI43_0_0RCTLogError(@"dispatchViewManagerCommand must be called with a string or integer command");
    return;
  }

  NSArray *newArgs = [@[ [NSNumber numberWithInteger:tag] ] arrayByAddingObjectsFromArray:args];
  [_bridge.batchedBridge
      dispatchBlock:^{
        [method invokeWithBridge:self->_bridge module:self->_componentData.manager arguments:newArgs];
        [self->_bridge.uiManager setNeedsLayout];
      }
              queue:ABI43_0_0RCTGetUIManagerQueue()];
}

@end
