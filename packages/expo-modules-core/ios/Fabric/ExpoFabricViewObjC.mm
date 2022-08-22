// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/ExpoFabricViewObjC.h>

#import <react/renderer/componentregistry/ComponentDescriptorProvider.h>
#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/ExpoViewComponentDescriptor.h>
#import <ExpoModulesCore/Swift.h>

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
  auto flavor = std::make_shared<std::string const>([NSStringFromClass([self class]) UTF8String]);
  auto componentName = facebook::react::ComponentName{flavor->c_str()};
  return facebook::react::ComponentDescriptorProvider {
    reinterpret_cast<facebook::react::ComponentHandle>(componentName),
    componentName,
    flavor,
    &facebook::react::concreteComponentDescriptorConstructor<expo::ExpoViewComponentDescriptor>
  };
}

- (void)updateProps:(const facebook::react::Props::Shared &)props oldProps:(const facebook::react::Props::Shared &)oldProps
{
  const auto &newViewProps = *std::static_pointer_cast<ExpoViewProps const>(props);
  auto proxiedProperties = newViewProps.proxiedProperties;
  if (proxiedProperties.isObject()) {
    for (auto& item : proxiedProperties.items()) {
      NSString *name = [NSString stringWithCString:item.first.c_str() encoding:NSUTF8StringEncoding];
      id value = convertFollyDynamicToId(item.second);
      [self updateProp:name withValue:value];
    }
  }

  [super updateProps:props oldProps:oldProps];
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

- (void)updateProp:(nonnull NSString *)propName withValue:(nonnull id)value
{
  // Implemented in `ExpoFabricView.swift`
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
