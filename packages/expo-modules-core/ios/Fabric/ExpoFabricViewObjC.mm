// Copyright 2022-present 650 Industries. All rights reserved.

#import <objc/runtime.h>
#import <ExpoModulesCore/ExpoFabricViewObjC.h>

#import <react/renderer/componentregistry/ComponentDescriptorProvider.h>
#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/ExpoViewComponentDescriptor.h>
#import <ExpoModulesCore/Swift.h>

#ifdef RN_FABRIC_ENABLED
#import <React/RCTSurfacePresenter.h>
#import <React/RCTMountingManager.h>
#import <React/RCTComponentViewRegistry.h>
#endif

#ifdef __cplusplus
#import <string.h>
#endif

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

@implementation ExpoFabricViewObjC {
  ExpoViewEventEmitter::Shared _eventEmitter;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const expo::ExpoViewProps>();
    _props = defaultProps;

    self.contentView = [[UIView alloc] initWithFrame:CGRectZero];
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

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  // The `contentView` should always be at the back. Shifting the index makes sure that child components are mounted on top of it.
  [super mountChildComponentView:childComponentView index:index + 1];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  // All child components are mounted on top of `contentView`, so the index needs to be shifted by one.
  [super unmountChildComponentView:childComponentView index:index + 1];
}

- (void)updateProps:(const facebook::react::Props::Shared &)props oldProps:(const facebook::react::Props::Shared &)oldProps
{
  const auto &newViewProps = *std::static_pointer_cast<ExpoViewProps const>(props);
  NSMutableDictionary<NSString *, id> *propsMap = [[NSMutableDictionary alloc] init];

  for (const auto &item : newViewProps.propsMap) {
    NSString *propName = [NSString stringWithUTF8String:item.first.c_str()];

    // Ignore props inherited from the base view and Yoga.
    if ([self supportsPropWithName:propName]) {
      propsMap[propName] = convertFollyDynamicToId(item.second);
    }
  }

  [self updateProps:propsMap];
  [super updateProps:props oldProps:oldProps];
  [self viewDidUpdateProps];
}

- (void)updateEventEmitter:(const react::EventEmitter::Shared &)eventEmitter
{
  [super updateEventEmitter:eventEmitter];
  _eventEmitter = std::static_pointer_cast<const ExpoViewEventEmitter>(eventEmitter);
}

#pragma mark - Events

- (void)dispatchEvent:(nonnull NSString *)eventName payload:(nullable id)payload
{
  _eventEmitter->dispatch([normalizeEventName(eventName) UTF8String], [payload](jsi::Runtime &runtime) {
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

#pragma mark - Methods to override in the subclass

- (nullable EXAppContext *)__injectedAppContext
{
  [NSException raise:@"UninjectedException" format:@"The AppContext must be injected in the subclass of 'ExpoFabricView'"];
  return nil;
}

- (nonnull NSString *)__injectedModuleName
{
  [NSException raise:@"UninjectedException" format:@"The module name must be injected in the subclass of 'ExpoFabricView'"];
  return nil;
}

@end
