// Copyright 2015-present 650 Industries. All rights reserved.

/**
 This class is the Objective-C component of SwiftUIVirtualView. This file essentially combines:
   - iOS `UIView`
   - react-native's `UIView+ComponentViewProtocol`
   - Expo's `ExpoFabricViewObjC`
 */

#import <ExpoModulesCore/SwiftUIVirtualViewObjC.h>

#import <ExpoModulesCore/ExpoViewComponentDescriptor.h>
#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/SwiftUIViewProps.h>
#import <React/RCTAssert.h>
#import <React/RCTComponentViewProtocol.h>

namespace react = facebook::react;

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

} // namespace

/**
 Cache for component flavors, where the key is a view class name and value is the flavor.
 Flavors must be cached in order to keep using the same component handle after app reloads.
 */
static std::unordered_map<std::string, expo::ExpoViewComponentDescriptor::Flavor> _componentFlavorsCache;

@implementation SwiftUIVirtualViewObjC {
  react::SharedViewProps _props;
  react::SharedViewEventEmitter _eventEmitter;
  expo::ExpoViewShadowNode::ConcreteState::Shared _state;
}

- (instancetype)init
{
  if (self = [super init]) {
    static const auto defaultProps = std::make_shared<const expo::SwiftUIViewProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - UIView(UIViewHierarchy)

- (nullable UIView *)superview
{
  return nil;
}

- (NSArray<UIView *> *)subviews
{
  return @[];
}

- (nullable UIWindow *)window
{
  return nil;
}

- (void)removeFromSuperview
{
}

- (void)insertSubview:(UIView *)view atIndex:(NSInteger)index
{
}

- (void)exchangeSubviewAtIndex:(NSInteger)index1 withSubviewAtIndex:(NSInteger)index2
{
}

- (void)addSubview:(UIView *)view
{
}

- (void)insertSubview:(UIView *)view belowSubview:(UIView *)siblingSubview
{
}

- (void)insertSubview:(UIView *)view aboveSubview:(UIView *)siblingSubview
{
}

- (void)bringSubviewToFront:(UIView *)view
{
}

- (void)sendSubviewToBack:(UIView *)view
{
}

- (void)didAddSubview:(UIView *)subview
{
}

- (void)willRemoveSubview:(UIView *)subview
{
}

- (void)willMoveToSuperview:(nullable UIView *)newSuperview
{
}

- (void)didMoveToSuperview
{
}

- (void)willMoveToWindow:(nullable UIWindow *)newWindow
{
}

- (void)didMoveToWindow
{
}

- (BOOL)isDescendantOfView:(UIView *)view
{
  return NO;
}

#if DEBUG
- (BOOL)_isAncestorOfFirstResponder
{
  // UIKit internal selector called from `insertSubview:atIndex:`
  // when a VirtualView inserted to a standard UIView.
  // We use this call point here for sanity check.
  @throw [NSException exceptionWithName:@"SwiftUIVirtualViewException"
                                 reason:@"A SwiftUI view is inserted as a child of a standard UIView. Please check that you have wrapped the SwiftUI view in an WithHostingView."
                               userInfo:nil];
  return NO;
}
#endif

- (nullable UIView *)viewWithTag:(NSInteger)tag
{
  return nil;
}

- (void)setNeedsLayout
{
}

- (void)layoutIfNeeded
{
}

- (void)layoutSubviews
{
}

#pragma mark - RCTComponentViewProtocol implementations

+ (react::ComponentDescriptorProvider)componentDescriptorProvider
{
  std::string className([NSStringFromClass([self class]) UTF8String]);

  // We're caching the flavor pointer so that the component handle stay the same for the same class name.
  // Otherwise, the component handle would change after reload which may cause memory leaks and unexpected view recycling behavior.
  expo::ExpoViewComponentDescriptor::Flavor flavor = _componentFlavorsCache[className];

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

+ (std::vector<react::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders
{
  return {};
}

- (void)mountChildComponentView:(nonnull UIView *)childComponentView index:(NSInteger)index
{
  // Implemented in `SwiftUIVirtualView.swift`
}

- (void)unmountChildComponentView:(nonnull UIView *)childComponentView index:(NSInteger)index
{
  // Implemented in `SwiftUIVirtualView.swift`
}

- (void)updateProps:(const react::Props::Shared &)props oldProps:(const react::Props::Shared &)oldProps
{
  _props = std::static_pointer_cast<const ViewProps>(props);
}

- (void)updateEventEmitter:(const react::EventEmitter::Shared &)eventEmitter
{
  assert(std::dynamic_pointer_cast<const ViewEventEmitter>(eventEmitter));
  _eventEmitter = std::static_pointer_cast<const ViewEventEmitter>(eventEmitter);
}

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args
{
  // Default implementation does nothing.
}

- (void)updateLayoutMetrics:(const react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const react::LayoutMetrics &)oldLayoutMetrics
{
  // Yoga layout is not respected in SwiftUI integration.
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  if (updateMask & RNComponentViewUpdateMaskProps) {
    const auto &newProps = static_cast<const expo::ExpoViewProps &>(*_props);
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

- (void)prepareForRecycle
{
  // Default implementation does nothing.
  _eventEmitter.reset();
}

- (react::Props::Shared)props
{
  RCTAssert(NO, @"props access should be implemented by RCTViewComponentView.");
  return nullptr;
}

- (BOOL)isJSResponder
{
  // Default implementation always returns `NO`.
  return NO;
}

- (void)setIsJSResponder:(BOOL)isJSResponder
{
  // Default implementation does nothing.
}

- (void)setPropKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN:(nullable NSSet<NSString *> *)propKeys
{
  // Default implementation does nothing.
}

- (nullable NSSet<NSString *> *)propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN
{
  return nil;
}

- (void)updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  // Clipped subviews are not supported in SwiftUI integration.
}

- (void)dispatchEvent:(nonnull NSString *)eventName payload:(nullable id)payload
{
  const auto &eventEmitter = static_cast<const expo::ExpoViewEventEmitter &>(*_eventEmitter);

  eventEmitter.dispatch([normalizeEventName(eventName) UTF8String], [payload](jsi::Runtime &runtime) {
    return jsi::Value(runtime, expo::convertObjCObjectToJSIValue(runtime, payload));
  });
}

#pragma mark - Methods to override in Swift

- (void)updateProps:(nonnull NSDictionary<NSString *, id> *)props
{
  // Implemented in `SwiftUIVirtualView.swift`
}

- (void)updateState:(react::State::Shared const &)state oldState:(react::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<const expo::ExpoViewShadowNode::ConcreteState>(state);
}

- (void)viewDidUpdateProps
{
  // Implemented in `SwiftUIVirtualView.swift`
}

- (void)setShadowNodeSize:(float)width height:(float)height
{
  if (_state) {
    _state->updateState(expo::ExpoViewState(width, height));
  }
}

- (BOOL)supportsPropWithName:(nonnull NSString *)name
{
  // Implemented in `SwiftUIVirtualView.swift`
  return NO;
}

@end
