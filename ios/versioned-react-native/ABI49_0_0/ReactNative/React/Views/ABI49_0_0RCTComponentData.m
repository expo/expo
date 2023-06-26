/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTComponentData.h"

#import <objc/message.h>

#import "ABI49_0_0RCTBridge.h"
#import "ABI49_0_0RCTBridgeModule.h"
#import "ABI49_0_0RCTComponentEvent.h"
#import "ABI49_0_0RCTConstants.h"
#import "ABI49_0_0RCTConvert.h"
#import "ABI49_0_0RCTEventDispatcherProtocol.h"
#import "ABI49_0_0RCTParserUtils.h"
#import "ABI49_0_0RCTShadowView.h"
#import "ABI49_0_0RCTUtils.h"
#import "ABI49_0_0UIView+React.h"

typedef void (^ABI49_0_0RCTPropBlock)(id<ABI49_0_0RCTComponent> view, id json);
typedef NSMutableDictionary<NSString *, ABI49_0_0RCTPropBlock> ABI49_0_0RCTPropBlockDictionary;
typedef void (^InterceptorBlock)(NSString *eventName, NSDictionary *event, id sender);

/**
 * Get the converter function for the specified type
 */
static SEL selectorForType(NSString *type)
{
  const char *input = type.UTF8String;
  return NSSelectorFromString([ABI49_0_0RCTParseType(&input) stringByAppendingString:@":"]);
}

@implementation ABI49_0_0RCTComponentData {
  id<ABI49_0_0RCTComponent> _defaultView; // Only needed for ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY
  ABI49_0_0RCTPropBlockDictionary *_viewPropBlocks;
  ABI49_0_0RCTPropBlockDictionary *_shadowPropBlocks;
  __weak ABI49_0_0RCTBridge *_bridge;
  __weak id<ABI49_0_0RCTEventDispatcherProtocol> _eventDispatcher;
}

@synthesize manager = _manager;
@synthesize bridgelessViewManager = _bridgelessViewManager;

- (instancetype)initWithManagerClass:(Class)managerClass
                              bridge:(ABI49_0_0RCTBridge *)bridge
                     eventDispatcher:(id<ABI49_0_0RCTEventDispatcherProtocol>)eventDispatcher
{
  if ((self = [super init])) {
    _bridge = bridge;
    _eventDispatcher = eventDispatcher;
    _managerClass = managerClass;
    _viewPropBlocks = [NSMutableDictionary new];
    _shadowPropBlocks = [NSMutableDictionary new];

    _name = moduleNameForClass(managerClass);
  }
  return self;
}

- (ABI49_0_0RCTViewManager *)manager
{
  if (!_manager && _bridge) {
    _manager = [_bridge moduleForClass:_managerClass];
  } else if (!_manager && !_bridgelessViewManager) {
    _bridgelessViewManager = [_managerClass new];
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI49_0_0RCTDidInitializeModuleNotification
                                                        object:nil
                                                      userInfo:@{@"module" : _bridgelessViewManager}];
  }
  return _manager ?: _bridgelessViewManager;
}

ABI49_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (UIView *)createViewWithTag:(nullable NSNumber *)tag rootTag:(nullable NSNumber *)rootTag
{
  ABI49_0_0RCTAssertMainQueue();

  UIView *view = [self.manager view];
  view.ABI49_0_0ReactTag = tag;
  view.rootTag = rootTag;
  view.multipleTouchEnabled = YES;
  view.userInteractionEnabled = YES; // required for touch handling
  view.layer.allowsGroupOpacity = YES; // required for touch handling
  return view;
}

- (ABI49_0_0RCTShadowView *)createShadowViewWithTag:(NSNumber *)tag
{
  ABI49_0_0RCTShadowView *shadowView = [self.manager shadowView];
  shadowView.ABI49_0_0ReactTag = tag;
  shadowView.viewName = _name;
  return shadowView;
}

- (void)callCustomSetter:(SEL)setter onView:(id<ABI49_0_0RCTComponent>)view withProp:(id)json isShadowView:(BOOL)isShadowView
{
  json = ABI49_0_0RCTNilIfNull(json);
  if (!isShadowView) {
    if (!json && !_defaultView) {
      // Only create default view if json is null
      _defaultView = [self createViewWithTag:nil rootTag:nil];
    }
    ((void (*)(id, SEL, id, id, id))objc_msgSend)(self.manager, setter, json, view, _defaultView);
  } else {
    ((void (*)(id, SEL, id, id))objc_msgSend)(self.manager, setter, json, view);
  }
}

static ABI49_0_0RCTPropBlock createEventSetter(
    NSString *propName,
    SEL setter,
    InterceptorBlock eventInterceptor,
    id<ABI49_0_0RCTEventDispatcherProtocol> eventDispatcher)
{
  __weak id<ABI49_0_0RCTEventDispatcherProtocol> weakEventDispatcher = eventDispatcher;
  return ^(id target, id json) {
    void (^eventHandler)(NSDictionary *event) = nil;
    if ([ABI49_0_0RCTConvert BOOL:json]) {
      __weak id<ABI49_0_0RCTComponent> weakTarget = target;
      eventHandler = ^(NSDictionary *event) {
        // The component no longer exists, we shouldn't send the event
        id<ABI49_0_0RCTComponent> strongTarget = weakTarget;
        if (!strongTarget) {
          return;
        }

        if (eventInterceptor) {
          eventInterceptor(propName, event, strongTarget.ABI49_0_0ReactTag);
        } else {
          ABI49_0_0RCTComponentEvent *componentEvent = [[ABI49_0_0RCTComponentEvent alloc] initWithName:propName
                                                                              viewTag:strongTarget.ABI49_0_0ReactTag
                                                                                 body:event];
          [weakEventDispatcher sendEvent:componentEvent];
        }
      };
    }
    ((void (*)(id, SEL, id))objc_msgSend)(target, setter, eventHandler);
  };
}

static ABI49_0_0RCTPropBlock createNSInvocationSetter(NSMethodSignature *typeSignature, SEL type, SEL getter, SEL setter)
{
  NSInvocation *typeInvocation = [NSInvocation invocationWithMethodSignature:typeSignature];
  typeInvocation.selector = type;
  typeInvocation.target = [ABI49_0_0RCTConvert class];

  __block NSInvocation *targetInvocation = nil;
  __block NSMutableData *defaultValue = nil;

  return ^(id target, id json) {
    if (!target) {
      return;
    }

    // Get default value
    if (!defaultValue) {
      if (!json) {
        // We only set the defaultValue when we first pass a non-null
        // value, so if the first value sent for a prop is null, it's
        // a no-op (we'd be resetting it to its default when its
        // value is already the default).
        return;
      }
      // Use NSMutableData to store defaultValue instead of malloc, so
      // it will be freed automatically when setterBlock is released.
      defaultValue = [[NSMutableData alloc] initWithLength:typeSignature.methodReturnLength];
      if ([target respondsToSelector:getter]) {
        NSMethodSignature *signature = [target methodSignatureForSelector:getter];
        NSInvocation *sourceInvocation = [NSInvocation invocationWithMethodSignature:signature];
        sourceInvocation.selector = getter;
        [sourceInvocation invokeWithTarget:target];
        [sourceInvocation getReturnValue:defaultValue.mutableBytes];
      }
    }

    // Get value
    BOOL freeValueOnCompletion = NO;
    void *value = defaultValue.mutableBytes;
    if (json) {
      freeValueOnCompletion = YES;
      value = malloc(typeSignature.methodReturnLength);
      if (!value) {
        // CWE - 391 : Unchecked error condition
        // https://www.cvedetails.com/cwe-details/391/Unchecked-Error-Condition.html
        // https://eli.thegreenplace.net/2009/10/30/handling-out-of-memory-conditions-in-c
        abort();
      }
      [typeInvocation setArgument:&json atIndex:2];
      [typeInvocation invoke];
      [typeInvocation getReturnValue:value];
    }

    // Set value
    if (!targetInvocation) {
      NSMethodSignature *signature = [target methodSignatureForSelector:setter];
      targetInvocation = [NSInvocation invocationWithMethodSignature:signature];
      targetInvocation.selector = setter;
    }
    [targetInvocation setArgument:value atIndex:2];
    [targetInvocation invokeWithTarget:target];
    if (freeValueOnCompletion) {
      // Only free the value if we `malloc`d it locally, otherwise it
      // points to `defaultValue.mutableBytes`, which is managed by ARC.
      free(value);
    }
  };
}

- (ABI49_0_0RCTPropBlock)createPropBlock:(NSString *)name isShadowView:(BOOL)isShadowView
{
  // Get type
  SEL type = NULL;
  NSString *keyPath = nil;
  SEL selector =
      NSSelectorFromString([NSString stringWithFormat:@"propConfig%@_%@", isShadowView ? @"Shadow" : @"", name]);
  if ([_managerClass respondsToSelector:selector]) {
    NSArray<NSString *> *typeAndKeyPath = ((NSArray<NSString *> * (*)(id, SEL)) objc_msgSend)(_managerClass, selector);
    type = selectorForType(typeAndKeyPath[0]);
    keyPath = typeAndKeyPath.count > 1 ? typeAndKeyPath[1] : nil;
  } else {
    return ^(__unused id view, __unused id json) {
    };
  }

  // Check for custom setter
  if ([keyPath isEqualToString:@"__custom__"]) {
    // Get custom setter. There is no default view in the shadow case, so the selector is different.
    NSString *selectorString;
    if (!isShadowView) {
      selectorString =
          [NSString stringWithFormat:@"set_%@:for%@View:withDefaultView:", name, isShadowView ? @"Shadow" : @""];
    } else {
      selectorString = [NSString stringWithFormat:@"set_%@:forShadowView:", name];
    }

    SEL customSetter = NSSelectorFromString(selectorString);
    __weak ABI49_0_0RCTComponentData *weakSelf = self;
    return ^(id<ABI49_0_0RCTComponent> view, id json) {
      [weakSelf callCustomSetter:customSetter onView:view withProp:json isShadowView:isShadowView];
    };
  } else {
    // Disect keypath
    NSString *key = name;
    NSArray<NSString *> *parts = [keyPath componentsSeparatedByString:@"."];
    if (parts) {
      key = parts.lastObject;
      parts = [parts subarrayWithRange:(NSRange){0, parts.count - 1}];
    }

    // Get property getter
    SEL getter = NSSelectorFromString(key);

    // Get property setter
    SEL setter = NSSelectorFromString(
        [NSString stringWithFormat:@"set%@%@:", [key substringToIndex:1].uppercaseString, [key substringFromIndex:1]]);

    // Build setter block
    void (^setterBlock)(id target, id json) = nil;
    if (type == NSSelectorFromString(@"ABI49_0_0RCTBubblingEventBlock:") ||
        type == NSSelectorFromString(@"ABI49_0_0RCTDirectEventBlock:") ||
        type == NSSelectorFromString(@"ABI49_0_0RCTCapturingEventBlock:")) {
      // Special case for event handlers
      setterBlock =
          createEventSetter(name, setter, self.eventInterceptor, _bridge ? _bridge.eventDispatcher : _eventDispatcher);
    } else {
      // Ordinary property handlers
      NSMethodSignature *typeSignature = [[ABI49_0_0RCTConvert class] methodSignatureForSelector:type];
      if (!typeSignature) {
        ABI49_0_0RCTLogError(@"No +[ABI49_0_0RCTConvert %@] function found.", NSStringFromSelector(type));
        return ^(__unused id<ABI49_0_0RCTComponent> view, __unused id json) {
        };
      }
      switch (typeSignature.methodReturnType[0]) {
#define ABI49_0_0RCT_CASE(_value, _type)                                       \
  case _value: {                                                      \
    __block BOOL setDefaultValue = NO;                                \
    __block _type defaultValue;                                       \
    _type (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend;    \
    _type (*get)(id, SEL) = (typeof(get))objc_msgSend;                \
    void (*set)(id, SEL, _type) = (typeof(set))objc_msgSend;          \
    setterBlock = ^(id target, id json) {                             \
      if (json) {                                                     \
        if (!setDefaultValue && target) {                             \
          if ([target respondsToSelector:getter]) {                   \
            defaultValue = get(target, getter);                       \
          }                                                           \
          setDefaultValue = YES;                                      \
        }                                                             \
        set(target, setter, convert([ABI49_0_0RCTConvert class], type, json)); \
      } else if (setDefaultValue) {                                   \
        set(target, setter, defaultValue);                            \
      }                                                               \
    };                                                                \
    break;                                                            \
  }

        ABI49_0_0RCT_CASE(_C_SEL, SEL)
        ABI49_0_0RCT_CASE(_C_CHARPTR, const char *)
        ABI49_0_0RCT_CASE(_C_CHR, char)
        ABI49_0_0RCT_CASE(_C_UCHR, unsigned char)
        ABI49_0_0RCT_CASE(_C_SHT, short)
        ABI49_0_0RCT_CASE(_C_USHT, unsigned short)
        ABI49_0_0RCT_CASE(_C_INT, int)
        ABI49_0_0RCT_CASE(_C_UINT, unsigned int)
        ABI49_0_0RCT_CASE(_C_LNG, long)
        ABI49_0_0RCT_CASE(_C_ULNG, unsigned long)
        ABI49_0_0RCT_CASE(_C_LNG_LNG, long long)
        ABI49_0_0RCT_CASE(_C_ULNG_LNG, unsigned long long)
        ABI49_0_0RCT_CASE(_C_FLT, float)
        ABI49_0_0RCT_CASE(_C_DBL, double)
        ABI49_0_0RCT_CASE(_C_BOOL, BOOL)
        ABI49_0_0RCT_CASE(_C_PTR, void *)
        ABI49_0_0RCT_CASE(_C_ID, id)

        case _C_STRUCT_B:
        default: {
          setterBlock = createNSInvocationSetter(typeSignature, type, getter, setter);
          break;
        }
      }
    }

    return ^(__unused id view, __unused id json) {
      // Follow keypath
      id target = view;
      for (NSString *part in parts) {
        target = [target valueForKey:part];
      }

      // Set property with json
      setterBlock(target, ABI49_0_0RCTNilIfNull(json));
    };
  }
}

- (ABI49_0_0RCTPropBlock)propBlockForKey:(NSString *)name isShadowView:(BOOL)isShadowView
{
  ABI49_0_0RCTPropBlockDictionary *propBlocks = isShadowView ? _shadowPropBlocks : _viewPropBlocks;
  ABI49_0_0RCTPropBlock propBlock = propBlocks[name];
  if (!propBlock) {
    propBlock = [self createPropBlock:name isShadowView:isShadowView];

#if ABI49_0_0RCT_DEBUG
    // Provide more useful log feedback if there's an error
    ABI49_0_0RCTPropBlock unwrappedBlock = propBlock;
    __weak __typeof(self) weakSelf = self;
    propBlock = ^(id<ABI49_0_0RCTComponent> view, id json) {
      NSString *logPrefix = [NSString
          stringWithFormat:@"Error setting property '%@' of %@ with tag #%@: ", name, weakSelf.name, view.ABI49_0_0ReactTag];
      ABI49_0_0RCTPerformBlockWithLogPrefix(
          ^{
            unwrappedBlock(view, json);
          },
          logPrefix);
    };
#endif
    propBlocks[name] = [propBlock copy];
  }
  return propBlock;
}

- (void)setProps:(NSDictionary<NSString *, id> *)props forView:(id<ABI49_0_0RCTComponent>)view
{
  if (!view) {
    return;
  }

  [props enumerateKeysAndObjectsUsingBlock:^(NSString *key, id json, __unused BOOL *stop) {
    [self propBlockForKey:key isShadowView:NO](view, json);
  }];
}

- (void)setProps:(NSDictionary<NSString *, id> *)props forShadowView:(ABI49_0_0RCTShadowView *)shadowView
{
  if (!shadowView) {
    return;
  }

  [props enumerateKeysAndObjectsUsingBlock:^(NSString *key, id json, __unused BOOL *stop) {
    [self propBlockForKey:key isShadowView:YES](shadowView, json);
  }];
}

- (NSDictionary<NSString *, id> *)viewConfig
{
  NSMutableArray<NSString *> *bubblingEvents = [NSMutableArray new];
  NSMutableArray<NSString *> *capturingEvents = [NSMutableArray new];
  NSMutableArray<NSString *> *directEvents = [NSMutableArray new];

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  if (ABI49_0_0RCTClassOverridesInstanceMethod(_managerClass, @selector(customBubblingEventTypes))) {
    NSArray<NSString *> *events = [self.manager customBubblingEventTypes];
    for (NSString *event in events) {
      [bubblingEvents addObject:ABI49_0_0RCTNormalizeInputEventName(event)];
    }
  }
#pragma clang diagnostic pop

  unsigned int count = 0;
  NSMutableDictionary *propTypes = [NSMutableDictionary new];
  Method *methods = class_copyMethodList(object_getClass(_managerClass), &count);
  for (unsigned int i = 0; i < count; i++) {
    SEL selector = method_getName(methods[i]);
    const char *selectorName = sel_getName(selector);
    if (strncmp(selectorName, "propConfig", strlen("propConfig")) != 0) {
      continue;
    }

    // We need to handle both propConfig_* and propConfigShadow_* methods
    const char *underscorePos = strchr(selectorName + strlen("propConfig"), '_');
    if (!underscorePos) {
      continue;
    }

    NSString *name = @(underscorePos + 1);
    NSString *type = ((NSArray<NSString *> * (*)(id, SEL)) objc_msgSend)(_managerClass, selector)[0];
    if (ABI49_0_0RCT_DEBUG && propTypes[name] && ![propTypes[name] isEqualToString:type]) {
      ABI49_0_0RCTLogError(
          @"Property '%@' of component '%@' redefined from '%@' "
           "to '%@'",
          name,
          _name,
          propTypes[name],
          type);
    }

    if ([type isEqualToString:@"ABI49_0_0RCTBubblingEventBlock"]) {
      [bubblingEvents addObject:ABI49_0_0RCTNormalizeInputEventName(name)];
      propTypes[name] = @"BOOL";
    } else if ([type isEqualToString:@"ABI49_0_0RCTCapturingEventBlock"]) {
      [capturingEvents addObject:ABI49_0_0RCTNormalizeInputEventName(name)];
      propTypes[name] = @"BOOL";
    } else if ([type isEqualToString:@"ABI49_0_0RCTDirectEventBlock"]) {
      [directEvents addObject:ABI49_0_0RCTNormalizeInputEventName(name)];
      propTypes[name] = @"BOOL";
    } else {
      propTypes[name] = type;
    }
  }
  free(methods);

#if ABI49_0_0RCT_DEBUG
  for (NSString *event in bubblingEvents) {
    if ([directEvents containsObject:event]) {
      ABI49_0_0RCTLogError(
          @"Component '%@' registered '%@' as both a bubbling event "
           "and a direct event",
          _name,
          event);
    }
  }
#endif

  Class superClass = [_managerClass superclass];

  return @{
    @"propTypes" : propTypes,
    @"directEvents" : directEvents,
    @"bubblingEvents" : bubblingEvents,
    @"capturingEvents" : capturingEvents,
    @"baseModuleName" : superClass == [NSObject class] ? (id)kCFNull : moduleNameForClass(superClass),
  };
}

static NSString *moduleNameForClass(Class managerClass)
{
  // Hackety hack, this partially re-implements ABI49_0_0RCTBridgeModuleNameForClass
  // We want to get rid of ABI49_0_0RCT and RK prefixes, but a lot of JS code still references
  // view names by prefix. So, while ABI49_0_0RCTBridgeModuleNameForClass now drops these
  // prefixes by default, we'll still keep them around here.
  NSString *name = [managerClass moduleName];
  if (name.length == 0) {
    name = NSStringFromClass(managerClass);
  }
  name = ABI49_0_0EX_REMOVE_VERSION(name);
  if ([name hasPrefix:@"RK"]) {
    name = [name stringByReplacingCharactersInRange:(NSRange){0, @"RK".length} withString:@"RCT"];
  }
  if ([name hasSuffix:@"Manager"]) {
    name = [name substringToIndex:name.length - @"Manager".length];
  }

  ABI49_0_0RCTAssert(name.length, @"Invalid moduleName '%@'", name);

  return name;
}

@end
