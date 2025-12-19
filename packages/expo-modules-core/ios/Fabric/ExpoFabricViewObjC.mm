// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef RCT_NEW_ARCH_ENABLED

#import <objc/runtime.h>
#import <string.h>

#import <ExpoModulesCore/EXAppContextProtocol.h>
#import <ExpoModulesCore/ExpoFabricViewObjC.h>
#import <ExpoModulesCore/ExpoViewComponentDescriptor.h>

#import <ExpoModulesJSI/EXJSIConversions.h>

#import <React/RCTComponentViewFactory.h>
#import <react/renderer/componentregistry/ComponentDescriptorProvider.h>

using namespace expo;

namespace {

id convertFollyDynamicToId(const folly::dynamic &dyn) {
  // I could imagine an implementation which avoids copies by wrapping the
  // dynamic in a derived class of NSDictionary.  We can do that if profiling
  // implies it will help.

  switch (dyn.type()) {
  case folly::dynamic::NULLT:
    return (id)kCFNull;
  case folly::dynamic::BOOL:
    return dyn.getBool() ? @YES : @NO;
  case folly::dynamic::INT64:
    return @(dyn.getInt());
  case folly::dynamic::DOUBLE:
    return @(dyn.getDouble());
  case folly::dynamic::STRING:
    return [[NSString alloc] initWithBytes:dyn.c_str()
                                    length:dyn.size()
                                  encoding:NSUTF8StringEncoding];
  case folly::dynamic::ARRAY: {
    NSMutableArray *array =
        [[NSMutableArray alloc] initWithCapacity:dyn.size()];
    for (const auto &elem : dyn) {
      id value = convertFollyDynamicToId(elem);
      if (value) {
        [array addObject:value];
      }
    }
    return array;
  }
  case folly::dynamic::OBJECT: {
    NSMutableDictionary *dict =
        [[NSMutableDictionary alloc] initWithCapacity:dyn.size()];
    for (const auto &elem : dyn.items()) {
      id key = convertFollyDynamicToId(elem.first);
      id value = convertFollyDynamicToId(elem.second);
      if (key && value) {
        dict[key] = value;
      }
    }
    return dict;
  }
  }
}

} // namespace

/**
 React Native doesn't use the "on" prefix internally. Instead, it uses "top" but
 it's on the roadmap to get rid of it too. We're still using "on" in a few
 places, so let's make sure we normalize that.
 */
static NSString *normalizeEventName(NSString *eventName) {
  if ([eventName hasPrefix:@"on"]) {
    NSString *firstLetter =
        [[eventName substringWithRange:NSMakeRange(2, 1)] lowercaseString];
    return
        [firstLetter stringByAppendingString:[eventName substringFromIndex:3]];
  }
  return eventName;
}

/**
 Cache for component flavors, where the key is a view class name and value is
 the flavor. Flavors must be cached in order to keep using the same component
 handle after app reloads.
 */
static std::unordered_map<std::string, ExpoViewComponentDescriptor::Flavor>
    _componentFlavorsCache;

@implementation ExpoFabricViewObjC {
  ExpoViewShadowNode::ConcreteState::Shared _state;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps =
        std::make_shared<const expo::ExpoViewProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (facebook::react::ComponentDescriptorProvider)componentDescriptorProvider {
  std::string className([NSStringFromClass([self class]) UTF8String]);

  // We're caching the flavor pointer so that the component handle stay the same
  // for the same class name. Otherwise, the component handle would change after
  // reload which may cause memory leaks and unexpected view recycling behavior.
  ExpoViewComponentDescriptor::Flavor flavor =
      _componentFlavorsCache[className];

  if (flavor == nullptr) {
    flavor = _componentFlavorsCache[className] =
        std::make_shared<std::string const>(className);
  }

  ComponentName componentName = ComponentName{flavor->c_str()};
  ComponentHandle componentHandle =
      reinterpret_cast<ComponentHandle>(componentName);

  return ComponentDescriptorProvider{
      componentHandle, componentName, flavor,
      &facebook::react::concreteComponentDescriptorConstructor<
          expo::ExpoViewComponentDescriptor>};
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask {
  [super finalizeUpdates:updateMask];

  if (updateMask & RNComponentViewUpdateMaskProps) {
    const auto &newProps = static_cast<const ExpoViewProps &>(*_props);
    NSMutableDictionary<NSString *, id> *propsMap =
        [[NSMutableDictionary alloc] init];

    for (const auto &item : newProps.propsMap) {
      NSString *propName = [NSString stringWithUTF8String:item.first.c_str()];

      // Ignore props inherited from the base view and Yoga.
      if ([self supportsPropWithName:propName]) {
        propsMap[propName] = convertFollyDynamicToId(item.second);
      }
    }

    [self updateProps:propsMap];
    [self viewDidUpdateProps];
  }
}

#pragma mark - Events

- (void)dispatchEvent:(nonnull NSString *)eventName
              payload:(nullable id)payload {
  const auto &eventEmitter =
      static_cast<const ExpoViewEventEmitter &>(*_eventEmitter);

  eventEmitter.dispatch(
      [normalizeEventName(eventName) UTF8String],
      [payload](jsi::Runtime &runtime) {
        return jsi::Value(runtime,
                          expo::convertObjCObjectToJSIValue(runtime, payload));
      });
}

#pragma mark - Methods to override in Swift

- (void)updateProps:(nonnull NSDictionary<NSString *, id> *)props {
  // Implemented in `ExpoFabricView.swift`
}

- (void)updateState:(State::Shared const &)state
           oldState:(State::Shared const &)oldState {
  _state =
      std::static_pointer_cast<const ExpoViewShadowNode::ConcreteState>(state);
}

- (void)viewDidUpdateProps {
  // Implemented in `ExpoFabricView.swift`
}

- (void)setShadowNodeSize:(float)width height:(float)height {
  if (_state) {
#if REACT_NATIVE_TARGET_VERSION >= 82
    _state->updateState(ExpoViewState(width, height),
                        EventQueue::UpdateMode::unstable_Immediate);
#else
    _state->updateState(ExpoViewState(width, height));
#endif
  }
}

- (BOOL)supportsPropWithName:(nonnull NSString *)name {
  // Implemented in `ExpoFabricView.swift`
  return NO;
}

- (void)setStyleSize:(nullable NSNumber *)width
              height:(nullable NSNumber *)height {
  if (_state) {
    float widthValue =
        width ? [width floatValue] : std::numeric_limits<float>::quiet_NaN();
    float heightValue =
        height ? [height floatValue] : std::numeric_limits<float>::quiet_NaN();
#if REACT_NATIVE_TARGET_VERSION >= 82
    // synchronous update is only available in React Native 0.82 and above
    _state->updateState(
        expo::ExpoViewState::withStyleDimensions(widthValue, heightValue),
        EventQueue::UpdateMode::unstable_Immediate);
#else
    _state->updateState(
        expo::ExpoViewState::withStyleDimensions(widthValue, heightValue));
#endif
  }
}

#pragma mark - Component registration

+ (void)registerComponent:(nonnull id)viewModule
               appContext:(nonnull id<EXAppContextProtocol>)appContext {
  // EXViewModuleWrapper is defined in Swift - use runtime method calls
  Class viewModuleWrapperClass = NSClassFromString(@"EXViewModuleWrapper");
  Class wrappedViewModuleClass = nil;
  NSString *appId = [appContext appIdentifier];

  if (viewModuleWrapperClass) {
    SEL createSelector =
        NSSelectorFromString(@"createViewModuleWrapperClassWithModule:appId:");
    if ([viewModuleWrapperClass respondsToSelector:createSelector]) {
      NSMethodSignature *sig =
          [viewModuleWrapperClass methodSignatureForSelector:createSelector];
      NSInvocation *invocation =
          [NSInvocation invocationWithMethodSignature:sig];
      [invocation setTarget:viewModuleWrapperClass];
      [invocation setSelector:createSelector];
      [invocation setArgument:&viewModule atIndex:2];
      [invocation setArgument:&appId atIndex:3];
      [invocation invoke];
      [invocation getReturnValue:&wrappedViewModuleClass];
    }
  }

  if (!wrappedViewModuleClass) {
    return;
  }

  // ExpoFabricView is defined in Swift - use runtime method calls
  Class expoFabricViewClass = NSClassFromString(@"ExpoFabricView");
  Class viewClass = nil;

  if (expoFabricViewClass) {
    SEL makeViewSelector = NSSelectorFromString(
        @"makeViewClassForAppContext:moduleName:viewName:className:");
    if ([expoFabricViewClass respondsToSelector:makeViewSelector]) {
      // Get moduleName and viewName from viewModule using performSelector
      NSString *moduleName = nil;
      NSString *viewName = nil;
      SEL moduleNameSelector = NSSelectorFromString(@"moduleName");
      SEL viewNameSelector = NSSelectorFromString(@"viewName");
      if ([viewModule respondsToSelector:moduleNameSelector]) {
        moduleName = [viewModule performSelector:moduleNameSelector];
      }
      if ([viewModule respondsToSelector:viewNameSelector]) {
        viewName = [viewModule performSelector:viewNameSelector];
      }
      NSString *className = NSStringFromClass(wrappedViewModuleClass);
      NSMethodSignature *sig =
          [expoFabricViewClass methodSignatureForSelector:makeViewSelector];
      NSInvocation *invocation =
          [NSInvocation invocationWithMethodSignature:sig];
      [invocation setTarget:expoFabricViewClass];
      [invocation setSelector:makeViewSelector];
      id appContextArg = appContext;
      [invocation setArgument:&appContextArg atIndex:2];
      [invocation setArgument:&moduleName atIndex:3];
      [invocation setArgument:&viewName atIndex:4];
      [invocation setArgument:&className atIndex:5];
      [invocation invoke];
      [invocation getReturnValue:&viewClass];
    }
  }

  if (viewClass) {
    [[RCTComponentViewFactory currentComponentViewFactory]
        registerComponentViewClass:viewClass];
  }
}

@end

#endif // RCT_NEW_ARCH_ENABLED
