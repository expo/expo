// Copyright 2015-present 650 Industries. All rights reserved.

/**
 Production variant of SwiftUIVirtualView's ObjC layer.
 Inherits from NSObject (not UIView) for minimal overhead.
 The UIView hierarchy stubs swallow layout calls so Fabric/RCTMountingManager can send
 them without crashing. Mounting this view inside a standard UIView is still a fatal
 error: `forwardingTargetForSelector:` detects UIKit's first-responder probe and throws
 with an actionable message pointing at the missing `<Host>` wrapper.
 */

#import <ExpoModulesCore/SwiftUIVirtualViewObjC.h>
#import <ExpoModulesCore/ExpoViewComponentDescriptor.h>
#import <ExpoModulesCore/SwiftUIViewProps.h>

#import <ExpoModulesCore/EXJSIConversions.h>

#import <React/RCTLog.h>

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
static std::unordered_map<std::string, expo::ExpoViewComponentDescriptor<>::Flavor> _componentFlavorsCache;

@implementation SwiftUIVirtualViewObjC {
  react::SharedViewProps _props;
  react::SharedViewEventEmitter _eventEmitter;
  expo::ExpoViewShadowNode<>::ConcreteState::Shared _state;
}

- (instancetype)init
{
  if (self = [super init]) {
    static const auto defaultProps = std::make_shared<const expo::SwiftUIViewProps>();
    _props = defaultProps;
  }
  return self;
}

// Detect when this NSObject is incorrectly inserted into a UIKit view hierarchy.
// UIKit calls a private selector early in `_isAncestorOfFirstResponder`.
// We intercept it here and throw before the insertion proceeds.
// The selector name is constructed from fragments to
// avoid a literal private API string in the binary.
- (id)forwardingTargetForSelector:(SEL)aSelector
{
  static SEL hierarchyInsertionSelector;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *selName = [@[@"_", @"isAncestor", @"OfFirst", @"Responder"] componentsJoinedByString:@""];
    hierarchyInsertionSelector = NSSelectorFromString(selName);
  });
  if (aSelector == hierarchyInsertionSelector) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:[NSString stringWithFormat:
                                     @"A SwiftUI view \"%@\" (tag: %ld) is being mounted inside a standard UIView. "
                                     @"Wrap your component with `<Host>` from '@expo/ui/swift-ui'.",
                                     self.componentName ?: NSStringFromClass([self class]), (long)self.tag]
                                 userInfo:nil];
  }

  return [super forwardingTargetForSelector:aSelector];
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

#include "SwiftUIVirtualViewSharedImpl+Private.h"

@end
