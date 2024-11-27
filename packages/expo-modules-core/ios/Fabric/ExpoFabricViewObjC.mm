// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef RCT_NEW_ARCH_ENABLED

#import <objc/runtime.h>
#import <ExpoModulesCore/ExpoFabricViewObjC.h>

#import <react/renderer/componentregistry/ComponentDescriptorProvider.h>
#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/ExpoViewComponentDescriptor.h>
#import <ExpoModulesCore/Swift.h>

#import <React/React-Core-umbrella.h>

#import <string.h>

using namespace expo;

namespace {

id convertFollyDynamicToId(const folly::dynamic &dyn)
{
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
      return [[NSString alloc] initWithBytes:dyn.c_str() length:dyn.size() encoding:NSUTF8StringEncoding];
    case folly::dynamic::ARRAY: {
      NSMutableArray *array = [[NSMutableArray alloc] initWithCapacity:dyn.size()];
      for (const auto &elem : dyn) {
        id value = convertFollyDynamicToId(elem);
        if (value) {
          [array addObject:value];
        }
      }
      return array;
    }
    case folly::dynamic::OBJECT: {
      NSMutableDictionary *dict = [[NSMutableDictionary alloc] initWithCapacity:dyn.size()];
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
 React Native doesn't use the "on" prefix internally. Instead, it uses "top" but it's on the roadmap to get rid of it too.
 We're still using "on" in a few places, so let's make sure we normalize that.
 */
static NSString *normalizeEventName(NSString *eventName)
{
  if ([eventName hasPrefix:@"on"]) {
    NSString *firstLetter = [[eventName substringWithRange:NSMakeRange(2, 1)] lowercaseString];
    return [firstLetter stringByAppendingString:[eventName substringFromIndex:3]];
  }
  return eventName;
}

/**
 Cache for component flavors, where the key is a view class name and value is the flavor.
 Flavors must be cached in order to keep using the same component handle after app reloads.
 */
static std::unordered_map<std::string, ExpoViewComponentDescriptor::Flavor> _componentFlavorsCache;

@implementation ExpoFabricViewObjC

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const expo::ExpoViewProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (facebook::react::ComponentDescriptorProvider)componentDescriptorProvider
{
  std::string className([NSStringFromClass([self class]) UTF8String]);

  // We're caching the flavor pointer so that the component handle stay the same for the same class name.
  // Otherwise, the component handle would change after reload which may cause memory leaks and unexpected view recycling behavior.
  ExpoViewComponentDescriptor::Flavor flavor = _componentFlavorsCache[className];

  if (flavor == nullptr) {
    flavor = _componentFlavorsCache[className] = std::make_shared<std::string const>(className);
  }

  ComponentName componentName = ComponentName { flavor->c_str() };
  ComponentHandle componentHandle = reinterpret_cast<ComponentHandle>(componentName);

  return ComponentDescriptorProvider {
    componentHandle,
    componentName,
    flavor,
    &facebook::react::concreteComponentDescriptorConstructor<expo::ExpoViewComponentDescriptor>
  };
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];

  if (updateMask & RNComponentViewUpdateMaskProps) {
    const auto &newProps = static_cast<const ExpoViewProps &>(*_props);
    NSMutableDictionary<NSString *, id> *propsMap = [[NSMutableDictionary alloc] init];

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

- (void)dispatchEvent:(nonnull NSString *)eventName payload:(nullable id)payload
{
  const auto &eventEmitter = static_cast<const ExpoViewEventEmitter &>(*_eventEmitter);

  eventEmitter.dispatch([normalizeEventName(eventName) UTF8String], [payload](jsi::Runtime &runtime) {
    return jsi::Value(runtime, expo::convertObjCObjectToJSIValue(runtime, payload));
  });
}

#pragma mark - Methods to override in Swift

- (void)updateProps:(nonnull NSDictionary<NSString *, id> *)props
{
  // Implemented in `ExpoFabricView.swift`
}

- (void)viewDidUpdateProps
{
  // Implemented in `ExpoFabricView.swift`
}

- (BOOL)supportsPropWithName:(nonnull NSString *)name
{
  // Implemented in `ExpoFabricView.swift`
  return NO;
}

@end

#endif // RCT_NEW_ARCH_ENABLED
