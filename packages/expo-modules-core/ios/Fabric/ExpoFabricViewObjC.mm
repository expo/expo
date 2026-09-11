// Copyright 2022-present 650 Industries. All rights reserved.

#import <objc/runtime.h>
#import <string.h>

#import <ExpoModulesCore/EXAppContextProtocol.h>
#import <ExpoModulesCore/ExpoFabricViewObjC.h>
#import <ExpoModulesCore/ExpoViewComponentDescriptor.h>
#import <ExpoModulesCore/EXJSIConversions.h>

#import <React/RCTAssert.h>
#import <React/RCTComponentViewFactory.h>
#import <react/renderer/componentregistry/ComponentDescriptorProvider.h>

#include <cmath>
#include <optional>

using namespace expo;

namespace {

#if REACT_NATIVE_TARGET_VERSION >= 82

/**
 How many synchronous (`unstable_Immediate`) size commits a single view may issue per
 main-queue turn. The synchronous mode lets a self-sizing view adopt its measured content
 size within the current frame, but it is only safe while the measured size and the Yoga
 layout that results from committing it converge. When they persistently disagree (e.g. the
 Button Shapes accessibility setting changes how SwiftUI content re-measures under the frame
 it was granted), every synchronous commit re-triggers a measurement in the same run-loop
 turn and the feedback becomes an unbounded main-thread loop that freezes the app until the
 watchdog kills it. Updates over the budget are coalesced locally and committed
 asynchronously on the next turn, so a non-convergent layout settles across frames instead.
 */
constexpr NSUInteger kImmediateSizeUpdateBudgetPerTurn = 2;

/**
 Size deltas below this threshold (in points) are considered noise (e.g. rounding jitter
 between the pixel grid and SwiftUI's floating point sizes) and are not re-committed.
 */
constexpr float kSizeEpsilon = 0.05f;

struct SizePair {
  float width;
  float height;
};

bool nearlyEqualSize(float a, float b)
{
  if (std::isnan(a) || std::isnan(b)) {
    return std::isnan(a) && std::isnan(b);
  }
  if (a == b) {
    return true;
  }
  return std::fabs(a - b) <= kSizeEpsilon;
}

bool nearlyEqualSize(const SizePair &a, const SizePair &b)
{
  return nearlyEqualSize(a.width, b.width) && nearlyEqualSize(a.height, b.height);
}

/**
 A pending size update. Each channel maps to the corresponding pair of `ExpoViewState`
 fields; merging keeps the latest value per channel so deferred updates cannot erase
 the other channel (unlike replacing the whole state).
 */
struct SizeStatePatch {
  std::optional<SizePair> shadowDimensions;
  std::optional<SizePair> styleDimensions;

  bool empty() const
  {
    return !shadowDimensions && !styleDimensions;
  }

  void merge(const SizeStatePatch &newer)
  {
    if (newer.shadowDimensions) {
      shadowDimensions = newer.shadowDimensions;
    }
    if (newer.styleDimensions) {
      styleDimensions = newer.styleDimensions;
    }
  }
};

#endif // REACT_NATIVE_TARGET_VERSION >= 82

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
static std::unordered_map<std::string, ExpoViewComponentDescriptor<>::Flavor> _componentFlavorsCache;

@implementation ExpoFabricViewObjC {
  ExpoViewShadowNode<>::ConcreteState::Shared _state;
#if REACT_NATIVE_TARGET_VERSION >= 82
  NSUInteger _immediateSizeUpdatesInTurn;
  BOOL _sizeGuardResetScheduled;
  uint64_t _sizeGuardGeneration;
  std::optional<SizePair> _lastShadowSizeRequestInTurn;
  std::optional<SizePair> _lastStyleSizeRequestInTurn;
  SizeStatePatch _deferredSizePatch;
#endif
}

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
  ExpoViewComponentDescriptor<>::Flavor flavor = _componentFlavorsCache[className];

  if (flavor == nullptr) {
    flavor = _componentFlavorsCache[className] = std::make_shared<std::string const>(className);
  }

  react::ComponentName componentName = react::ComponentName { flavor->c_str() };
  react::ComponentHandle componentHandle = reinterpret_cast<react::ComponentHandle>(componentName);

  return react::ComponentDescriptorProvider {
    componentHandle,
    componentName,
    flavor,
    &facebook::react::concreteComponentDescriptorConstructor<expo::ExpoViewComponentDescriptor<>>
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
  if (!_eventEmitter) {
    return;
  }
  const auto &eventEmitter = static_cast<const ExpoViewEventEmitter &>(*_eventEmitter);

  eventEmitter.dispatch([normalizeEventName(eventName) UTF8String], [payload](jsi::Runtime &runtime) {
    return expo::convertObjCObjectToJSIValue(runtime, payload);
  });
}

#pragma mark - Methods to override in Swift

- (void)updateProps:(nonnull NSDictionary<NSString *, id> *)props
{
  // Implemented in `ExpoFabricView.swift`
}

- (void)updateState:(react::State::Shared const &)state oldState:(react::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<const ExpoViewShadowNode<>::ConcreteState>(state);
}

- (void)viewDidUpdateProps
{
  // Implemented in `ExpoFabricView.swift`
}

- (void)setShadowNodeSize:(float)width height:(float)height
{
#if REACT_NATIVE_TARGET_VERSION >= 82
  SizeStatePatch patch;
  patch.shadowDimensions = SizePair{
    width >= 0 ? width : std::numeric_limits<float>::quiet_NaN(),
    height >= 0 ? height : std::numeric_limits<float>::quiet_NaN()
  };
  [self submitSizePatch:patch];
#else
  if (_state) {
    _state->updateState(ExpoViewState(width, height));
  }
#endif
}

#if REACT_NATIVE_TARGET_VERSION >= 82

- (void)submitSizePatch:(const SizeStatePatch &)patch
{
  RCTAssertMainQueue();

  if (!_state) {
    return;
  }

  // Transient per-turn dedup: prevents re-entrant same-size requests from
  // committing again before `updateState` returns. Cleared every turn, so it
  // can never go stale across turns.
  if (patch.shadowDimensions) {
    if (_lastShadowSizeRequestInTurn && nearlyEqualSize(*_lastShadowSizeRequestInTurn, *patch.shadowDimensions)) {
      return;
    }
    _lastShadowSizeRequestInTurn = *patch.shadowDimensions;
  }
  if (patch.styleDimensions) {
    if (_lastStyleSizeRequestInTurn && nearlyEqualSize(*_lastStyleSizeRequestInTurn, *patch.styleDimensions)) {
      return;
    }
    _lastStyleSizeRequestInTurn = *patch.styleDimensions;
  }

  if (!_sizeGuardResetScheduled) {
    _sizeGuardResetScheduled = YES;
    const uint64_t generation = _sizeGuardGeneration;
    __weak ExpoFabricViewObjC *weakSelf = self;

    dispatch_async(dispatch_get_main_queue(), ^{
      ExpoFabricViewObjC *strongSelf = weakSelf;
      if (strongSelf == nil || strongSelf->_sizeGuardGeneration != generation) {
        return;
      }
      strongSelf->_sizeGuardResetScheduled = NO;
      strongSelf->_immediateSizeUpdatesInTurn = 0;
      strongSelf->_lastShadowSizeRequestInTurn.reset();
      strongSelf->_lastStyleSizeRequestInTurn.reset();

      SizeStatePatch pending = strongSelf->_deferredSizePatch;
      strongSelf->_deferredSizePatch = {};

      if (!pending.empty()) {
        // Deliberately entered into React Native's event queue only now: an
        // `unstable_Immediate` update from any other view flushes the whole
        // shared queue synchronously, which would pull an "asynchronous"
        // update enqueued during the previous turn right back into the
        // feedback loop this guard is breaking.
        [strongSelf dispatchSizePatch:pending updateMode:react::EventQueue::UpdateMode::Asynchronous];
      }
    });
  }

  if (_immediateSizeUpdatesInTurn < kImmediateSizeUpdateBudgetPerTurn) {
    _immediateSizeUpdatesInTurn++;
    [self dispatchSizePatch:patch updateMode:react::EventQueue::UpdateMode::unstable_Immediate];
  } else {
    _deferredSizePatch.merge(patch);
  }
}

- (void)dispatchSizePatch:(const SizeStatePatch &)patch updateMode:(react::EventQueue::UpdateMode)updateMode
{
  const auto state = _state;
  if (!state) {
    return;
  }

  state->updateState(
    [patch](const ExpoViewState &oldData) -> ExpoViewShadowNode<>::ConcreteState::SharedData {
      ExpoViewState newData = oldData;
      bool changed = false;

      if (patch.shadowDimensions &&
          !(nearlyEqualSize(oldData._width, patch.shadowDimensions->width) &&
            nearlyEqualSize(oldData._height, patch.shadowDimensions->height))) {
        newData._width = patch.shadowDimensions->width;
        newData._height = patch.shadowDimensions->height;
        changed = true;
      }
      if (patch.styleDimensions &&
          !(nearlyEqualSize(oldData._styleWidth, patch.styleDimensions->width) &&
            nearlyEqualSize(oldData._styleHeight, patch.styleDimensions->height))) {
        newData._styleWidth = patch.styleDimensions->width;
        newData._styleHeight = patch.styleDimensions->height;
        changed = true;
      }

      // Returning nullptr cancels the commit before any layout work happens,
      // so a no-op size update cannot dirty the tree.
      return changed ? std::make_shared<const ExpoViewState>(newData) : nullptr;
    },
    updateMode);
}

- (void)resetSizeUpdateGuard
{
  _sizeGuardGeneration++;
  _immediateSizeUpdatesInTurn = 0;
  _sizeGuardResetScheduled = NO;
  _lastShadowSizeRequestInTurn.reset();
  _lastStyleSizeRequestInTurn.reset();
  _deferredSizePatch = {};
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [self resetSizeUpdateGuard];
}

- (void)invalidate
{
  [super invalidate];
  [self resetSizeUpdateGuard];
}

#endif // REACT_NATIVE_TARGET_VERSION >= 82

- (BOOL)supportsPropWithName:(nonnull NSString *)name
{
  // Implemented in `ExpoFabricView.swift`
  return NO;
}

- (void)setStyleSize:(nullable NSNumber *)width height:(nullable NSNumber *)height
{
  float widthValue = width ? [width floatValue] : std::numeric_limits<float>::quiet_NaN();
  float heightValue = height ? [height floatValue] : std::numeric_limits<float>::quiet_NaN();
#if REACT_NATIVE_TARGET_VERSION >= 82
  SizeStatePatch patch;
  patch.styleDimensions = SizePair{
    widthValue >= 0 ? widthValue : std::numeric_limits<float>::quiet_NaN(),
    heightValue >= 0 ? heightValue : std::numeric_limits<float>::quiet_NaN()
  };
  [self submitSizePatch:patch];
#else
  if (_state) {
    _state->updateState(expo::ExpoViewState::withStyleDimensions(widthValue, heightValue));
  }
#endif
}

#pragma mark - Component registration

+ (void)registerComponent:(nonnull id)viewModule appContext:(nonnull id<EXAppContextProtocol>)appContext
{
  // Cache classes and selectors using dispatch_once to avoid repeated lookups
  static Class viewModuleWrapperClass;
  static Class expoFabricViewClass;
  static SEL createWrapperSelector;
  static SEL makeViewSelector;
  static SEL moduleNameSelector;
  static SEL viewNameSelector;

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // EXViewModuleWrapper is defined in Swift - use runtime lookup
    viewModuleWrapperClass = NSClassFromString(@"EXViewModuleWrapper");
    if (!viewModuleWrapperClass) {
      NSLog(@"[ExpoFabricViewObjC] Warning: Could not find class "
            @"'EXViewModuleWrapper'");
    }
    // ExpoFabricView is defined in Swift - use runtime lookup
    expoFabricViewClass = NSClassFromString(@"ExpoFabricView");
    if (!expoFabricViewClass) {
      NSLog(@"[ExpoFabricViewObjC] Warning: Could not find class "
            @"'ExpoFabricView'");
    }
    // Cache all selectors
    createWrapperSelector =
        NSSelectorFromString(@"createViewModuleWrapperClassWithModule:appId:");
    makeViewSelector = NSSelectorFromString(
        @"makeViewClassForAppContext:moduleName:viewName:className:");
    moduleNameSelector = NSSelectorFromString(@"moduleName");
    viewNameSelector = NSSelectorFromString(@"viewName");
  });

  if (!viewModuleWrapperClass) {
    NSLog(@"[ExpoFabricViewObjC] Error: Cannot register component - "
          @"EXViewModuleWrapper class not found");
    return;
  }

  if (!expoFabricViewClass) {
    NSLog(@"[ExpoFabricViewObjC] Error: Cannot register component - "
          @"ExpoFabricView class not found");
    return;
  }

  Class wrappedViewModuleClass = nil;
  NSString *appId = [appContext appIdentifier];

  if (![viewModuleWrapperClass respondsToSelector:createWrapperSelector]) {
    NSLog(@"[ExpoFabricViewObjC] Error: EXViewModuleWrapper does not respond "
          @"to createViewModuleWrapperClassWithModule:appId:");
    return;
  }

  NSMethodSignature *sig =
      [viewModuleWrapperClass methodSignatureForSelector:createWrapperSelector];
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:sig];
  [invocation setTarget:viewModuleWrapperClass];
  [invocation setSelector:createWrapperSelector];
  [invocation setArgument:&viewModule atIndex:2];
  [invocation setArgument:&appId atIndex:3];
  [invocation invoke];
  [invocation getReturnValue:&wrappedViewModuleClass];

  if (!wrappedViewModuleClass) {
    NSLog(@"[ExpoFabricViewObjC] Error: Failed to create wrapped view module "
          @"class for module: %@",
          viewModule);
    return;
  }

  if (![expoFabricViewClass respondsToSelector:makeViewSelector]) {
    NSLog(@"[ExpoFabricViewObjC] Error: ExpoFabricView does not respond to "
          @"makeViewClassForAppContext:moduleName:viewName:className:");
    return;
  }

  // Get moduleName and viewName from viewModule using cached selectors
  NSString *moduleName = nil;
  NSString *viewName = nil;
  if ([viewModule respondsToSelector:moduleNameSelector]) {
    moduleName = [viewModule performSelector:moduleNameSelector];
  } else {
    NSLog(@"[ExpoFabricViewObjC] Warning: viewModule does not respond to "
          @"moduleName selector");
  }
  if ([viewModule respondsToSelector:viewNameSelector]) {
    viewName = [viewModule performSelector:viewNameSelector];
  } else {
    NSLog(@"[ExpoFabricViewObjC] Warning: viewModule does not respond to "
          @"viewName selector");
  }

  NSString *className = NSStringFromClass(wrappedViewModuleClass);
  NSMethodSignature *makeViewSig =
      [expoFabricViewClass methodSignatureForSelector:makeViewSelector];
  NSInvocation *makeViewInvocation =
      [NSInvocation invocationWithMethodSignature:makeViewSig];
  [makeViewInvocation setTarget:expoFabricViewClass];
  [makeViewInvocation setSelector:makeViewSelector];
  id appContextArg = appContext;
  [makeViewInvocation setArgument:&appContextArg atIndex:2];
  [makeViewInvocation setArgument:&moduleName atIndex:3];
  [makeViewInvocation setArgument:&viewName atIndex:4];
  [makeViewInvocation setArgument:&className atIndex:5];
  [makeViewInvocation invoke];

  Class viewClass = nil;
  [makeViewInvocation getReturnValue:&viewClass];

  if (viewClass) {
    [[RCTComponentViewFactory currentComponentViewFactory] registerComponentViewClass:viewClass];
  } else {
    NSLog(@"[ExpoFabricViewObjC] Error: Failed to create view class for "
          @"module: %@, view: %@",
          moduleName, viewName);
  }
}

@end
