/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0RCTLegacyViewManagerInteropCoordinator.h"
#include <ABI47_0_0React/ABI47_0_0RCTBridge+Private.h>
#include <ABI47_0_0React/ABI47_0_0RCTBridgeMethod.h>
#include <ABI47_0_0React/ABI47_0_0RCTComponentData.h>
#include <ABI47_0_0React/ABI47_0_0RCTEventDispatcherProtocol.h>
#include <ABI47_0_0React/ABI47_0_0RCTFollyConvert.h>
#include <ABI47_0_0React/ABI47_0_0RCTModuleData.h>
#include <ABI47_0_0React/ABI47_0_0RCTModuleMethod.h>
#include <ABI47_0_0React/ABI47_0_0RCTUIManager.h>
#include <ABI47_0_0React/ABI47_0_0RCTUIManagerUtils.h>
#include <ABI47_0_0React/ABI47_0_0RCTUtils.h>
#include <folly/json.h>
#include <objc/runtime.h>

using namespace ABI47_0_0facebook::ABI47_0_0React;

@implementation ABI47_0_0RCTLegacyViewManagerInteropCoordinator {
  ABI47_0_0RCTComponentData *_componentData;
  __weak ABI47_0_0RCTBridge *_bridge;
  __weak ABI47_0_0RCTBridgeModuleDecorator *_bridgelessInteropData;
  /*
   Each instance of `ABI47_0_0RCTLegacyViewManagerInteropComponentView` registers a block to which events are dispatched.
   This is the container that maps unretained UIView pointer to a block to which the event is dispatched.
   */
  NSMutableDictionary<NSNumber *, InterceptorBlock> *_eventInterceptors;

  /*
   * In bridgeless mode, instead of using the bridge to look up ABI47_0_0RCTModuleData,
   * store that information locally.
   */
  NSMutableArray<id<ABI47_0_0RCTBridgeMethod>> *_moduleMethods;
  NSMutableDictionary<NSString *, id<ABI47_0_0RCTBridgeMethod>> *_moduleMethodsByName;
}

- (instancetype)initWithComponentData:(ABI47_0_0RCTComponentData *)componentData
                               bridge:(ABI47_0_0RCTBridge *)bridge
                bridgelessInteropData:(ABI47_0_0RCTBridgeModuleDecorator *)bridgelessInteropData;
{
  if (self = [super init]) {
    _componentData = componentData;
    _bridge = bridge;
    _bridgelessInteropData = bridgelessInteropData;
    if (bridgelessInteropData) {
      //  During bridge mode, ABI47_0_0RCTBridgeModules will be decorated with these APIs by the bridge.
      ABI47_0_0RCTAssert(
          _bridge == nil,
          @"ABI47_0_0RCTLegacyViewManagerInteropCoordinator should not be intialized with ABI47_0_0RCTBridgeModuleDecorator in bridge mode.");
    }

    _eventInterceptors = [NSMutableDictionary new];

    __weak __typeof(self) weakSelf = self;
    _componentData.eventInterceptor = ^(NSString *eventName, NSDictionary *event, NSNumber *ABI47_0_0ReactTag) {
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        InterceptorBlock block = [strongSelf->_eventInterceptors objectForKey:ABI47_0_0ReactTag];
        if (block) {
          block(std::string([ABI47_0_0RCTNormalizeInputEventName(eventName) UTF8String]), convertIdToFollyDynamic(event ?: @{}));
        }
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

- (UIView *)createPaperViewWithTag:(NSInteger)tag;
{
  UIView *view = [_componentData createViewWithTag:[NSNumber numberWithInteger:tag] rootTag:NULL];
  [_bridgelessInteropData attachInteropAPIsToModule:(id<ABI47_0_0RCTBridgeModule>)_componentData.bridgelessViewManager];
  return view;
}

- (void)setProps:(folly::dynamic const &)props forView:(UIView *)view
{
  if (props.isObject()) {
    NSDictionary<NSString *, id> *convertedProps = convertFollyDynamicToId(props);
    [_componentData setProps:convertedProps forView:view];
  }
}

- (NSString *)componentViewName
{
  return ABI47_0_0RCTDropABI47_0_0ReactPrefixes(_componentData.name);
}

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args ABI47_0_0ReactTag:(NSInteger)tag
{
  Class managerClass = _componentData.managerClass;
  [self _lookupModuleMethodsIfNecessary];
  ABI47_0_0RCTModuleData *moduleData = [_bridge.batchedBridge moduleDataForName:ABI47_0_0RCTBridgeModuleNameForClass(managerClass)];
  id<ABI47_0_0RCTBridgeMethod> method;
  if ([commandName isKindOfClass:[NSNumber class]]) {
    method = moduleData ? moduleData.methods[[commandName intValue]] : _moduleMethods[[commandName intValue]];
  } else if ([commandName isKindOfClass:[NSString class]]) {
    method = moduleData ? moduleData.methodsByName[commandName] : _moduleMethodsByName[commandName];
    if (method == nil) {
      ABI47_0_0RCTLogError(@"No command found with name \"%@\"", commandName);
    }
  } else {
    ABI47_0_0RCTLogError(@"dispatchViewManagerCommand must be called with a string or integer command");
    return;
  }

  NSArray *newArgs = [@[ [NSNumber numberWithInteger:tag] ] arrayByAddingObjectsFromArray:args];

  if (_bridge) {
    [_bridge.batchedBridge
        dispatchBlock:^{
          [method invokeWithBridge:self->_bridge module:self->_componentData.manager arguments:newArgs];
          [self->_bridge.uiManager setNeedsLayout];
        }
                queue:ABI47_0_0RCTGetUIManagerQueue()];
  } else {
    // TODO T86826778 - Figure out which queue this should be dispatched to.
    [method invokeWithBridge:nil module:self->_componentData.manager arguments:newArgs];
  }
}

#pragma mark - Private

// This is copy-pasta from ABI47_0_0RCTModuleData.
- (void)_lookupModuleMethodsIfNecessary
{
  if (!_bridge && !_moduleMethods) {
    _moduleMethods = [NSMutableArray new];
    _moduleMethodsByName = [NSMutableDictionary new];

    unsigned int methodCount;
    Class cls = _componentData.managerClass;
    while (cls && cls != [NSObject class] && cls != [NSProxy class]) {
      Method *methods = class_copyMethodList(object_getClass(cls), &methodCount);

      for (unsigned int i = 0; i < methodCount; i++) {
        Method method = methods[i];
        SEL selector = method_getName(method);
        if ([NSStringFromSelector(selector) hasPrefix:@"__rct_export__"]) {
          IMP imp = method_getImplementation(method);
          auto exportedMethod = ((const ABI47_0_0RCTMethodInfo *(*)(id, SEL))imp)(_componentData.managerClass, selector);
          id<ABI47_0_0RCTBridgeMethod> moduleMethod =
              [[ABI47_0_0RCTModuleMethod alloc] initWithExportedMethod:exportedMethod moduleClass:_componentData.managerClass];
          [_moduleMethodsByName setValue:moduleMethod forKey:[NSString stringWithUTF8String:moduleMethod.JSMethodName]];
          [_moduleMethods addObject:moduleMethod];
        }
      }

      free(methods);
      cls = class_getSuperclass(cls);
    }
  }
}

@end
