/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0RCTLegacyViewManagerInteropCoordinator.h"
#include <ABI49_0_0React/ABI49_0_0RCTBridge+Private.h>
#include <ABI49_0_0React/ABI49_0_0RCTBridgeMethod.h>
#include <ABI49_0_0React/ABI49_0_0RCTComponentData.h>
#include <ABI49_0_0React/ABI49_0_0RCTEventDispatcherProtocol.h>
#include <ABI49_0_0React/ABI49_0_0RCTFollyConvert.h>
#include <ABI49_0_0React/ABI49_0_0RCTModuleData.h>
#include <ABI49_0_0React/ABI49_0_0RCTModuleMethod.h>
#include <ABI49_0_0React/ABI49_0_0RCTUIManager.h>
#include <ABI49_0_0React/ABI49_0_0RCTUIManagerUtils.h>
#include <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#include <folly/json.h>
#include <objc/runtime.h>

using namespace ABI49_0_0facebook::ABI49_0_0React;

@implementation ABI49_0_0RCTLegacyViewManagerInteropCoordinator {
  ABI49_0_0RCTComponentData *_componentData;
  __weak ABI49_0_0RCTBridge *_bridge;
  __weak ABI49_0_0RCTBridgeModuleDecorator *_bridgelessInteropData;
  /*
   Each instance of `ABI49_0_0RCTLegacyViewManagerInteropComponentView` registers a block to which events are dispatched.
   This is the container that maps unretained UIView pointer to a block to which the event is dispatched.
   */
  NSMutableDictionary<NSNumber *, InterceptorBlock> *_eventInterceptors;

  /*
   * In bridgeless mode, instead of using the bridge to look up ABI49_0_0RCTModuleData,
   * store that information locally.
   */
  NSMutableArray<id<ABI49_0_0RCTBridgeMethod>> *_moduleMethods;
  NSMutableDictionary<NSString *, id<ABI49_0_0RCTBridgeMethod>> *_moduleMethodsByName;
}

- (instancetype)initWithComponentData:(ABI49_0_0RCTComponentData *)componentData
                               bridge:(ABI49_0_0RCTBridge *)bridge
                bridgelessInteropData:(ABI49_0_0RCTBridgeModuleDecorator *)bridgelessInteropData;
{
  if (self = [super init]) {
    _componentData = componentData;
    _bridge = bridge;
    _bridgelessInteropData = bridgelessInteropData;
    if (bridgelessInteropData) {
      //  During bridge mode, ABI49_0_0RCTBridgeModules will be decorated with these APIs by the bridge.
      ABI49_0_0RCTAssert(
          _bridge == nil,
          @"ABI49_0_0RCTLegacyViewManagerInteropCoordinator should not be initialized with ABI49_0_0RCTBridgeModuleDecorator in bridge mode.");
    }

    _eventInterceptors = [NSMutableDictionary new];

    __weak __typeof(self) weakSelf = self;
    _componentData.eventInterceptor = ^(NSString *eventName, NSDictionary *event, NSNumber *ABI49_0_0ReactTag) {
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        InterceptorBlock block = [strongSelf->_eventInterceptors objectForKey:ABI49_0_0ReactTag];
        if (block) {
          block(std::string([ABI49_0_0RCTNormalizeInputEventName(eventName) UTF8String]), convertIdToFollyDynamic(event ?: @{}));
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
  [_bridgelessInteropData attachInteropAPIsToModule:(id<ABI49_0_0RCTBridgeModule>)_componentData.bridgelessViewManager];
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
  return ABI49_0_0RCTDropABI49_0_0ReactPrefixes(_componentData.name);
}

- (void)handleCommand:(NSString *)commandName
                 args:(NSArray *)args
             ABI49_0_0ReactTag:(NSInteger)tag
            paperView:(nonnull UIView *)paperView
{
  Class managerClass = _componentData.managerClass;
  [self _lookupModuleMethodsIfNecessary];
  ABI49_0_0RCTModuleData *moduleData = [_bridge.batchedBridge moduleDataForName:ABI49_0_0RCTBridgeModuleNameForClass(managerClass)];
  id<ABI49_0_0RCTBridgeMethod> method;

  // We can't use `[NSString intValue]` as "0" is a valid command,
  // but also a falsy value. [NSNumberFormatter numberFromString] returns a
  // `NSNumber *` which is NULL when it's to be NULL
  // and it points to 0 when the string is @"0" (not a falsy value).
  NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];

  if ([commandName isKindOfClass:[NSNumber class]] || [formatter numberFromString:commandName] != NULL) {
    method = moduleData ? moduleData.methods[[commandName intValue]] : _moduleMethods[[commandName intValue]];
  } else if ([commandName isKindOfClass:[NSString class]]) {
    method = moduleData ? moduleData.methodsByName[commandName] : _moduleMethodsByName[commandName];
    if (method == nil) {
      ABI49_0_0RCTLogError(@"No command found with name \"%@\"", commandName);
    }
  } else {
    ABI49_0_0RCTLogError(@"dispatchViewManagerCommand must be called with a string or integer command");
    return;
  }

  NSArray *newArgs = [@[ [NSNumber numberWithInteger:tag] ] arrayByAddingObjectsFromArray:args];

  if (_bridge) {
    [self _addViewToRegistry:paperView withTag:tag];
    [_bridge.batchedBridge
        dispatchBlock:^{
          [method invokeWithBridge:self->_bridge module:self->_componentData.manager arguments:newArgs];
          [self->_bridge.uiManager setNeedsLayout];
        }
                queue:ABI49_0_0RCTGetUIManagerQueue()];
    [self _removeViewFromRegistryWithTag:tag];
  } else {
    // TODO T86826778 - Figure out which queue this should be dispatched to.
    [method invokeWithBridge:nil module:self->_componentData.manager arguments:newArgs];
  }
}

#pragma mark - Private
- (void)_addViewToRegistry:(UIView *)view withTag:(NSInteger)tag
{
  [self _addUIBlock:^(ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    if ([viewRegistry objectForKey:@(tag)] != NULL) {
      return;
    }
    NSMutableDictionary<NSNumber *, UIView *> *mutableViewRegistry =
        (NSMutableDictionary<NSNumber *, UIView *> *)viewRegistry;
    [mutableViewRegistry setObject:view forKey:@(tag)];
  }];
}

- (void)_removeViewFromRegistryWithTag:(NSInteger)tag
{
  [self _addUIBlock:^(ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    if ([viewRegistry objectForKey:@(tag)] == NULL) {
      return;
    }

    NSMutableDictionary<NSNumber *, UIView *> *mutableViewRegistry =
        (NSMutableDictionary<NSNumber *, UIView *> *)viewRegistry;
    [mutableViewRegistry removeObjectForKey:@(tag)];
  }];
}

- (void)_addUIBlock:(ABI49_0_0RCTViewManagerUIBlock)block
{
  __weak __typeof__(self) weakSelf = self;
  [_bridge.batchedBridge
      dispatchBlock:^{
        __typeof__(self) strongSelf = weakSelf;
        [strongSelf->_bridge.uiManager addUIBlock:block];
      }
              queue:ABI49_0_0RCTGetUIManagerQueue()];
}

// This is copy-pasta from ABI49_0_0RCTModuleData.
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
          auto exportedMethod = ((const ABI49_0_0RCTMethodInfo *(*)(id, SEL))imp)(_componentData.managerClass, selector);
          id<ABI49_0_0RCTBridgeMethod> moduleMethod =
              [[ABI49_0_0RCTModuleMethod alloc] initWithExportedMethod:exportedMethod moduleClass:_componentData.managerClass];
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
