/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTKeyboardObserver.h"

#import <ABI42_0_0FBReactNativeSpec/ABI42_0_0FBReactNativeSpec.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>

#import "ABI42_0_0CoreModulesPlugins.h"

static NSDictionary *ABI42_0_0RCTParseKeyboardNotification(NSNotification *notification);

@interface ABI42_0_0RCTKeyboardObserver () <ABI42_0_0NativeKeyboardObserverSpec>
@end

@implementation ABI42_0_0RCTKeyboardObserver

ABI42_0_0RCT_EXPORT_MODULE()

- (void)startObserving
{
#if !TARGET_OS_TV

  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];

#define ADD_KEYBOARD_HANDLER(NAME, SELECTOR) [nc addObserver:self selector:@selector(SELECTOR:) name:NAME object:nil]

  ADD_KEYBOARD_HANDLER(UIKeyboardWillShowNotification, keyboardWillShow);
  ADD_KEYBOARD_HANDLER(UIKeyboardDidShowNotification, keyboardDidShow);
  ADD_KEYBOARD_HANDLER(UIKeyboardWillHideNotification, keyboardWillHide);
  ADD_KEYBOARD_HANDLER(UIKeyboardDidHideNotification, keyboardDidHide);
  ADD_KEYBOARD_HANDLER(UIKeyboardWillChangeFrameNotification, keyboardWillChangeFrame);
  ADD_KEYBOARD_HANDLER(UIKeyboardDidChangeFrameNotification, keyboardDidChangeFrame);

#undef ADD_KEYBOARD_HANDLER

#endif
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[
    @"keyboardWillShow",
    @"keyboardDidShow",
    @"keyboardWillHide",
    @"keyboardDidHide",
    @"keyboardWillChangeFrame",
    @"keyboardDidChangeFrame"
  ];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

// Bridge might be already invalidated by the time the keyboard is about to be dismissed.
// This might happen, for example, when reload from the packager is performed.
// Thus we need to check against nil here.
#define IMPLEMENT_KEYBOARD_HANDLER(EVENT)                                              \
  -(void)EVENT : (NSNotification *)notification                                        \
  {                                                                                    \
    if (!self.bridge) {                                                                \
      return;                                                                          \
    }                                                                                  \
    [self sendEventWithName:@ #EVENT body:ABI42_0_0RCTParseKeyboardNotification(notification)]; \
  }

IMPLEMENT_KEYBOARD_HANDLER(keyboardWillShow)
IMPLEMENT_KEYBOARD_HANDLER(keyboardDidShow)
IMPLEMENT_KEYBOARD_HANDLER(keyboardWillHide)
IMPLEMENT_KEYBOARD_HANDLER(keyboardDidHide)
IMPLEMENT_KEYBOARD_HANDLER(keyboardWillChangeFrame)
IMPLEMENT_KEYBOARD_HANDLER(keyboardDidChangeFrame)

- (std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::CallInvoker>)nativeInvoker
                     perfLogger:(id<ABI42_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<ABI42_0_0facebook::ABI42_0_0React::NativeKeyboardObserverSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

NS_INLINE NSDictionary *ABI42_0_0RCTRectDictionaryValue(CGRect rect)
{
  return @{
    @"screenX" : @(rect.origin.x),
    @"screenY" : @(rect.origin.y),
    @"width" : @(rect.size.width),
    @"height" : @(rect.size.height),
  };
}

static NSString *ABI42_0_0RCTAnimationNameForCurve(UIViewAnimationCurve curve)
{
  switch (curve) {
    case UIViewAnimationCurveEaseIn:
      return @"easeIn";
    case UIViewAnimationCurveEaseInOut:
      return @"easeInEaseOut";
    case UIViewAnimationCurveEaseOut:
      return @"easeOut";
    case UIViewAnimationCurveLinear:
      return @"linear";
    default:
      return @"keyboard";
  }
}

static NSDictionary *ABI42_0_0RCTParseKeyboardNotification(NSNotification *notification)
{
#if TARGET_OS_TV
  return @{};
#else
  NSDictionary *userInfo = notification.userInfo;
  CGRect beginFrame = [userInfo[UIKeyboardFrameBeginUserInfoKey] CGRectValue];
  CGRect endFrame = [userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue];
  NSTimeInterval duration = [userInfo[UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  UIViewAnimationCurve curve =
      static_cast<UIViewAnimationCurve>([userInfo[UIKeyboardAnimationCurveUserInfoKey] integerValue]);
  NSInteger isLocalUserInfoKey = [userInfo[UIKeyboardIsLocalUserInfoKey] integerValue];

  return @{
    @"startCoordinates" : ABI42_0_0RCTRectDictionaryValue(beginFrame),
    @"endCoordinates" : ABI42_0_0RCTRectDictionaryValue(endFrame),
    @"duration" : @(duration * 1000.0), // ms
    @"easing" : ABI42_0_0RCTAnimationNameForCurve(curve),
    @"isEventFromThisApp" : isLocalUserInfoKey == 1 ? @YES : @NO,
  };
#endif
}

Class ABI42_0_0RCTKeyboardObserverCls(void)
{
  return ABI42_0_0RCTKeyboardObserver.class;
}
