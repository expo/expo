// Copyright 2026-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/ExpoSwiftUIViewObjC.h>
#import <ExpoModulesCore/NewComponentRegistry.h>
#import <ExpoModulesCore/NewViewShadowNode.h>
#import <ExpoModulesCore/ViewEventDispatch.h>

#import <React/RCTComponentViewProtocol.h>
#import <React/RCTLog.h>

#include <mutex>

@implementation ExpoSwiftUIViewObjC {
  facebook::react::SharedViewProps _props;
  facebook::react::SharedViewEventEmitter _eventEmitter;
  // Guards `_eventEmitter`: Fabric sets it on the main thread, and events can be dispatched from any thread.
  std::mutex _eventEmitterMutex;
}

- (instancetype)init
{
  if (self = [super init]) {
    // `finalizeUpdates:` reads the props as `NewViewProps`, so the default props must be of that type too.
    _props = expo::views::NewViewShadowNode::defaultSharedProps();
  }
  return self;
}

#if TARGET_OS_OSX
- (void)setReactTag:(nullable NSNumber *)reactTag
{
  self.tag = reactTag.integerValue;
}

- (nullable NSNumber *)reactTag
{
  return @(self.tag);
}
#endif // TARGET_OS_OSX

// Detects when this NSObject is mounted in a UIKit view, like `SwiftUIVirtualViewObjC` does: UIKit calls a private
// selector early in `_isAncestorOfFirstResponder`, so the insertion throws before it goes on. The selector name is built
// from fragments to keep the private API name out of the binary.
- (id)forwardingTargetForSelector:(SEL)aSelector
{
  static SEL hierarchyInsertionSelector;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *selectorName = [@[ @"_", @"isAncestor", @"OfFirst", @"Responder" ] componentsJoinedByString:@""];
    hierarchyInsertionSelector = NSSelectorFromString(selectorName);
  });
  if (aSelector == hierarchyInsertionSelector) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:[NSString stringWithFormat:
                                                      @"A SwiftUI view \"%@\" (tag: %ld) is being mounted inside a standard UIView. "
                                                      @"Wrap your component with `<Host>` from '@expo/ui/swift-ui'.",
                                                      @(expo::views::componentDescriptorProvider([self class]).name),
                                                      (long)self.tag]
                                 userInfo:nil];
  }
  return [super forwardingTargetForSelector:aSelector];
}

#pragma mark - UIView(UIViewHierarchy)

// Fabric calls these on every component view. They do nothing, because the view isn't in the UIKit hierarchy.

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

#pragma mark - RCTComponentViewProtocol

+ (facebook::react::ComponentDescriptorProvider)componentDescriptorProvider
{
  return expo::views::componentDescriptorProvider(self);
}

+ (std::vector<facebook::react::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders
{
  return {};
}

+ (BOOL)shouldBeRecycled
{
  // Like the views of `ExpoNativeViewObjC`, the views aren't recycled.
  return NO;
}

- (void)mountChildComponentView:(nonnull UIView *)childComponentView index:(NSInteger)index
{
  // Implemented in `SwiftUINativeView.swift`
}

- (void)unmountChildComponentView:(nonnull UIView *)childComponentView index:(NSInteger)index
{
  // Implemented in `SwiftUINativeView.swift`
}

- (void)updateProps:(const facebook::react::Props::Shared &)props oldProps:(const facebook::react::Props::Shared &)oldProps
{
  _props = std::static_pointer_cast<const facebook::react::ViewProps>(props);
}

- (void)updateEventEmitter:(const facebook::react::EventEmitter::Shared &)eventEmitter
{
  std::lock_guard<std::mutex> lock(_eventEmitterMutex);
  _eventEmitter = std::static_pointer_cast<const facebook::react::ViewEventEmitter>(eventEmitter);
}

- (void)updateState:(const facebook::react::State::Shared &)state oldState:(const facebook::react::State::Shared &)oldState
{
  // `NewViewShadowNode` has no state.
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics
{
  // SwiftUI lays out the view, not Yoga.
}

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  // The views have no commands.
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  if (updateMask & RNComponentViewUpdateMaskProps) {
    const auto &props = static_cast<const expo::views::NewViewProps &>(*_props);
    [self updateDecodedProps:props.decodedProps.get()];
  }
}

- (void)prepareForRecycle
{
  std::lock_guard<std::mutex> lock(_eventEmitterMutex);
  _eventEmitter.reset();
}

- (void)invalidate
{
  [self prepareForRecycle];
}

- (facebook::react::Props::Shared)props
{
  return _props;
}

- (BOOL)isJSResponder
{
  return NO;
}

- (void)setIsJSResponder:(BOOL)isJSResponder
{
  // SwiftUI handles the touches, not the JS responder system.
}

- (void)setPropKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN:(nullable NSSet<NSString *> *)propKeys
{
  // Animated can't set the props of these views.
}

- (nullable NSSet<NSString *> *)propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN
{
  return nil;
}

- (void)updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *_Nonnull)clipView
{
  // SwiftUI clips the views, not React Native.
}

#pragma mark - Methods to override in Swift

- (void)updateDecodedProps:(nullable const void *)decodedProps
{
  // Implemented in `SwiftUINativeView.swift`
}

#pragma mark - EXViewEventEmitting

- (void)dispatchEvent:(NSString *)name encodePayload:(nullable EXViewEventPayloadEncoder)encodePayload
{
  facebook::react::SharedViewEventEmitter eventEmitter;
  {
    std::lock_guard<std::mutex> lock(_eventEmitterMutex);
    eventEmitter = _eventEmitter;
  }
  expo::views::dispatchViewEvent(eventEmitter, name, encodePayload);
}

@end
