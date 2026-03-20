// Copyright 2015-present 650 Industries. All rights reserved.

// Shared RCTComponentViewProtocol implementation included by both
// SwiftUIVirtualViewObjC.mm (NSObject base) and SwiftUIVirtualViewObjCDev.mm (UIView base).
//
// Before including this file, the .mm must:
//   1. #import the relevant header
//   2. Define the C++ namespace aliases and helper functions
//   3. Open an @implementation block with these ivars:
//        react::SharedViewProps _props;
//        react::SharedViewEventEmitter _eventEmitter;
//        expo::ExpoViewShadowNode<>::ConcreteState::Shared _state;

#pragma mark - RCTComponentViewProtocol implementations

+ (react::ComponentDescriptorProvider)componentDescriptorProvider
{
  std::string className([NSStringFromClass([self class]) UTF8String]);

  // We're caching the flavor pointer so that the component handle stay the same for the same class name.
  // Otherwise, the component handle would change after reload which may cause memory leaks and unexpected view recycling behavior.
  expo::ExpoViewComponentDescriptor<>::Flavor flavor = _componentFlavorsCache[className];

  if (flavor == nullptr) {
    flavor = _componentFlavorsCache[className] = std::make_shared<std::string const>(className);
  }

  ComponentName componentName = ComponentName { flavor->c_str() };
  ComponentHandle componentHandle = reinterpret_cast<ComponentHandle>(componentName);

  return ComponentDescriptorProvider {
    componentHandle,
    componentName,
    flavor,
    &facebook::react::concreteComponentDescriptorConstructor<expo::ExpoViewComponentDescriptor<>>
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
  _state = std::static_pointer_cast<const expo::ExpoViewShadowNode<>::ConcreteState>(state);
}

- (void)viewDidUpdateProps
{
  // Implemented in `SwiftUIVirtualView.swift`
}

- (void)setShadowNodeSize:(float)width height:(float)height
{
  if (_state) {
#if REACT_NATIVE_TARGET_VERSION >= 82
    _state->updateState(expo::ExpoViewState(width, height), EventQueue::UpdateMode::unstable_Immediate);
#else
    _state->updateState(expo::ExpoViewState(width, height));
#endif
  }
}

- (void)setStyleSize:(nullable NSNumber *)width height:(nullable NSNumber *)height
{
  if (_state) {
    float widthValue = width ? [width floatValue] : std::numeric_limits<float>::quiet_NaN();
    float heightValue = height ? [height floatValue] : std::numeric_limits<float>::quiet_NaN();
#if REACT_NATIVE_TARGET_VERSION >= 82
    _state->updateState(expo::ExpoViewState::withStyleDimensions(widthValue, heightValue), EventQueue::UpdateMode::unstable_Immediate);
#else
    _state->updateState(expo::ExpoViewState::withStyleDimensions(widthValue, heightValue));
#endif
  }
}

- (BOOL)supportsPropWithName:(nonnull NSString *)name
{
  // Implemented in `SwiftUIVirtualView.swift`
  return NO;
}

- (void)invalidate
{
  // Default implementation does nothing.
  [self prepareForRecycle];
}
