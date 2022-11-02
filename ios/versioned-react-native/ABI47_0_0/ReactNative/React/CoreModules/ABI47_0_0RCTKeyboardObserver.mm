/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTKeyboardObserver.h"

#import <ABI47_0_0FBReactNativeSpec/ABI47_0_0FBReactNativeSpec.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcherProtocol.h>

#import "ABI47_0_0CoreModulesPlugins.h"

static NSDictionary *ABI47_0_0RCTParseKeyboardNotification(NSNotification *notification);

@interface ABI47_0_0RCTKeyboardObserver () <ABI47_0_0NativeKeyboardObserverSpec>
@end

@implementation ABI47_0_0RCTKeyboardObserver

ABI47_0_0RCT_EXPORT_MODULE()

- (void)startObserving
{
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];

#define ADD_KEYBOARD_HANDLER(NAME, SELECTOR) [nc addObserver:self selector:@selector(SELECTOR:) name:NAME object:nil]

  ADD_KEYBOARD_HANDLER(UIKeyboardWillShowNotification, keyboardWillShow);
  ADD_KEYBOARD_HANDLER(UIKeyboardDidShowNotification, keyboardDidShow);
  ADD_KEYBOARD_HANDLER(UIKeyboardWillHideNotification, keyboardWillHide);
  ADD_KEYBOARD_HANDLER(UIKeyboardDidHideNotification, keyboardDidHide);
  ADD_KEYBOARD_HANDLER(UIKeyboardWillChangeFrameNotification, keyboardWillChangeFrame);
  ADD_KEYBOARD_HANDLER(UIKeyboardDidChangeFrameNotification, keyboardDidChangeFrame);

#undef ADD_KEYBOARD_HANDLER
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
    if (!self.callableJSModules) {                                                     \
      return;                                                                          \
    }                                                                                  \
    [self sendEventWithName:@ #EVENT body:ABI47_0_0RCTParseKeyboardNotification(notification)]; \
  }

IMPLEMENT_KEYBOARD_HANDLER(keyboardWillShow)
IMPLEMENT_KEYBOARD_HANDLER(keyboardDidShow)
IMPLEMENT_KEYBOARD_HANDLER(keyboardWillHide)
IMPLEMENT_KEYBOARD_HANDLER(keyboardDidHide)
IMPLEMENT_KEYBOARD_HANDLER(keyboardWillChangeFrame)
IMPLEMENT_KEYBOARD_HANDLER(keyboardDidChangeFrame)

- (std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::TurboModule>)getTurboModule:
    (const ABI47_0_0facebook::ABI47_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI47_0_0facebook::ABI47_0_0React::NativeKeyboardObserverSpecJSI>(params);
}

@end

NS_INLINE NSDictionary *ABI47_0_0RCTRectDictionaryValue(CGRect rect)
{
  return @{
    @"screenX" : @(rect.origin.x),
    @"screenY" : @(rect.origin.y),
    @"width" : @(rect.size.width),
    @"height" : @(rect.size.height),
  };
}

static NSString *ABI47_0_0RCTAnimationNameForCurve(UIViewAnimationCurve curve)
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

static NSDictionary *ABI47_0_0RCTParseKeyboardNotification(NSNotification *notification)
{
  NSDictionary *userInfo = notification.userInfo;
  CGRect beginFrame = [userInfo[UIKeyboardFrameBeginUserInfoKey] CGRectValue];
  CGRect endFrame = [userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue];
  NSTimeInterval duration = [userInfo[UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  UIViewAnimationCurve curve =
      static_cast<UIViewAnimationCurve>([userInfo[UIKeyboardAnimationCurveUserInfoKey] integerValue]);
  NSInteger isLocalUserInfoKey = [userInfo[UIKeyboardIsLocalUserInfoKey] integerValue];

  return @{
    @"startCoordinates" : ABI47_0_0RCTRectDictionaryValue(beginFrame),
    @"endCoordinates" : ABI47_0_0RCTRectDictionaryValue(endFrame),
    @"duration" : @(duration * 1000.0), // ms
    @"easing" : ABI47_0_0RCTAnimationNameForCurve(curve),
    @"isEventFromThisApp" : isLocalUserInfoKey == 1 ? @YES : @NO,
  };
}

Class ABI47_0_0RCTKeyboardObserverCls(void)
{
  return ABI47_0_0RCTKeyboardObserver.class;
}
