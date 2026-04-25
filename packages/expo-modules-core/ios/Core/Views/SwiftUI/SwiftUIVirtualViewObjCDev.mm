// Copyright 2015-present 650 Industries. All rights reserved.

/**
 Dev-mode variant of SwiftUIVirtualView's ObjC layer.
 Inherits from UIView so that `_isAncestorOfFirstResponder` is safe when the component
 is incorrectly placed without a `<Host>` wrapper.
 */

#import <ExpoModulesCore/SwiftUIVirtualViewObjCDev.h>
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
 Component flavor cache. Mirrors the cache in `SwiftUIVirtualViewObjC.mm`; each class owns
 its own translation-unit-local copy and they function identically. They are NOT a single
 shared static — only one of the two classes is instantiated in a given build (dev vs.
 release), so no de-duplication is needed.
 */
static std::unordered_map<std::string, expo::ExpoViewComponentDescriptor<>::Flavor> _componentFlavorsCache;

@implementation SwiftUIVirtualViewObjCDev {
  react::SharedViewProps _props;
  react::SharedViewEventEmitter _eventEmitter;
  expo::ExpoViewShadowNode<>::ConcreteState::Shared _state;
}

- (instancetype)init
{
  if (self = [super initWithFrame:CGRectZero]) {
    static const auto defaultProps = std::make_shared<const expo::SwiftUIViewProps>();
    _props = defaultProps;
    self.hidden = YES;
#if TARGET_OS_IOS || TARGET_OS_TV
    self.userInteractionEnabled = NO;
#endif
  }
  return self;
}

#if TARGET_OS_IOS || TARGET_OS_TV
- (void)didMoveToSuperview
{
  [super didMoveToSuperview];
  if (self.superview != nil) {
    RCTLogError(@"A SwiftUI view \"%@\" (tag: %ld) is being mounted inside a standard UIView. "
                @"Double check that in JSX you have wrapped your component with "
                @"`<Host>` from '@expo/ui/swift-ui'.",
                self.componentName ?: NSStringFromClass([self class]), (long)self.tag);
  }
}
#else
- (void)viewDidMoveToSuperview
{
  [super viewDidMoveToSuperview];
  if (self.superview != nil) {
    RCTLogError(@"A SwiftUI view \"%@\" (tag: %ld) is being mounted inside a standard NSView. "
                @"Double check that in JSX you have wrapped your component with "
                @"`<Host>` from '@expo/ui/swift-ui'.",
                self.componentName ?: NSStringFromClass([self class]), (long)self.tag);
  }
}
#endif // TARGET_OS_IOS || TARGET_OS_TV

#include "SwiftUIVirtualViewSharedImpl+Private.h"

@end
