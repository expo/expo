/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTAlertManager.h"

#import <ABI47_0_0FBReactNativeSpec/ABI47_0_0FBReactNativeSpec.h>
#import <ABI47_0_0RCTTypeSafety/ABI47_0_0RCTConvertHelpers.h>
#import <ABI47_0_0React/ABI47_0_0RCTAssert.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTLog.h>
#import <ABI47_0_0React/ABI47_0_0RCTUtils.h>

#import "ABI47_0_0CoreModulesPlugins.h"
#import "ABI47_0_0RCTAlertController.h"

@implementation ABI47_0_0RCTConvert (UIAlertViewStyle)

ABI47_0_0RCT_ENUM_CONVERTER(
    ABI47_0_0RCTAlertViewStyle,
    (@{
      @"default" : @(ABI47_0_0RCTAlertViewStyleDefault),
      @"secure-text" : @(ABI47_0_0RCTAlertViewStyleSecureTextInput),
      @"plain-text" : @(ABI47_0_0RCTAlertViewStylePlainTextInput),
      @"login-password" : @(ABI47_0_0RCTAlertViewStyleLoginAndPasswordInput),
    }),
    ABI47_0_0RCTAlertViewStyleDefault,
    integerValue)

@end

@implementation ABI47_0_0RCTConvert (UIUserInterfaceStyle)

ABI47_0_0RCT_ENUM_CONVERTER(
    UIUserInterfaceStyle,
    (@{
      @"unspecified" : @(UIUserInterfaceStyleUnspecified),
      @"light" : @(UIUserInterfaceStyleLight),
      @"dark" : @(UIUserInterfaceStyleDark),
    }),
    UIUserInterfaceStyleUnspecified,
    integerValue)

@end

@interface ABI47_0_0RCTAlertManager () <ABI47_0_0NativeAlertManagerSpec>

@end

@implementation ABI47_0_0RCTAlertManager {
  NSHashTable *_alertControllers;
}

ABI47_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  for (UIAlertController *alertController in _alertControllers) {
    [alertController.presentingViewController dismissViewControllerAnimated:YES completion:nil];
  }
}

/**
 * @param {NSDictionary} args Dictionary of the form
 *
 *   @{
 *     @"message": @"<Alert message>",
 *     @"buttons": @[
 *       @{@"<key1>": @"<title1>"},
 *       @{@"<key2>": @"<title2>"},
 *     ],
 *     @"cancelButtonKey": @"<key2>",
 *   }
 * The key from the `buttons` dictionary is passed back in the callback on click.
 * Buttons are displayed in the order they are specified.
 */
ABI47_0_0RCT_EXPORT_METHOD(alertWithArgs : (ABI47_0_0JS::NativeAlertManager::Args &)args callback : (ABI47_0_0RCTResponseSenderBlock)callback)
{
  NSString *title = [ABI47_0_0RCTConvert NSString:args.title()];
  NSString *message = [ABI47_0_0RCTConvert NSString:args.message()];
  ABI47_0_0RCTAlertViewStyle type = [ABI47_0_0RCTConvert ABI47_0_0RCTAlertViewStyle:args.type()];
  NSArray<NSDictionary *> *buttons =
      [ABI47_0_0RCTConvert NSDictionaryArray:ABI47_0_0RCTConvertOptionalVecToArray(args.buttons(), ^id(id<NSObject> element) {
                    return element;
                  })];
  NSString *defaultValue = [ABI47_0_0RCTConvert NSString:args.defaultValue()];
  NSString *cancelButtonKey = [ABI47_0_0RCTConvert NSString:args.cancelButtonKey()];
  NSString *destructiveButtonKey = [ABI47_0_0RCTConvert NSString:args.destructiveButtonKey()];
  UIKeyboardType keyboardType = [ABI47_0_0RCTConvert UIKeyboardType:args.keyboardType()];

  if (!title && !message) {
    ABI47_0_0RCTLogError(@"Must specify either an alert title, or message, or both");
    return;
  }

  if (buttons.count == 0) {
    if (type == ABI47_0_0RCTAlertViewStyleDefault) {
      buttons = @[ @{@"0" : ABI47_0_0RCTUIKitLocalizedString(@"OK")} ];
      cancelButtonKey = @"0";
    } else {
      buttons = @[
        @{@"0" : ABI47_0_0RCTUIKitLocalizedString(@"OK")},
        @{@"1" : ABI47_0_0RCTUIKitLocalizedString(@"Cancel")},
      ];
      cancelButtonKey = @"1";
    }
  }

  ABI47_0_0RCTAlertController *alertController = [ABI47_0_0RCTAlertController alertControllerWithTitle:title
                                                                             message:nil
                                                                      preferredStyle:UIAlertControllerStyleAlert];

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    UIUserInterfaceStyle userInterfaceStyle = [ABI47_0_0RCTConvert UIUserInterfaceStyle:args.userInterfaceStyle()];
    alertController.overrideUserInterfaceStyle = userInterfaceStyle;
  }
#endif

  switch (type) {
    case ABI47_0_0RCTAlertViewStylePlainTextInput: {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.secureTextEntry = NO;
        textField.text = defaultValue;
        textField.keyboardType = keyboardType;
      }];
      break;
    }
    case ABI47_0_0RCTAlertViewStyleSecureTextInput: {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = ABI47_0_0RCTUIKitLocalizedString(@"Password");
        textField.secureTextEntry = YES;
        textField.text = defaultValue;
        textField.keyboardType = keyboardType;
      }];
      break;
    }
    case ABI47_0_0RCTAlertViewStyleLoginAndPasswordInput: {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = ABI47_0_0RCTUIKitLocalizedString(@"Login");
        textField.text = defaultValue;
        textField.keyboardType = keyboardType;
      }];
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = ABI47_0_0RCTUIKitLocalizedString(@"Password");
        textField.secureTextEntry = YES;
      }];
      break;
    }
    case ABI47_0_0RCTAlertViewStyleDefault:
      break;
  }

  alertController.message = message;

  for (NSDictionary<NSString *, id> *button in buttons) {
    if (button.count != 1) {
      ABI47_0_0RCTLogError(@"Button definitions should have exactly one key.");
    }
    NSString *buttonKey = button.allKeys.firstObject;
    NSString *buttonTitle = [ABI47_0_0RCTConvert NSString:button[buttonKey]];
    UIAlertActionStyle buttonStyle = UIAlertActionStyleDefault;
    if ([buttonKey isEqualToString:cancelButtonKey]) {
      buttonStyle = UIAlertActionStyleCancel;
    } else if ([buttonKey isEqualToString:destructiveButtonKey]) {
      buttonStyle = UIAlertActionStyleDestructive;
    }
    __weak ABI47_0_0RCTAlertController *weakAlertController = alertController;
    [alertController
        addAction:[UIAlertAction
                      actionWithTitle:buttonTitle
                                style:buttonStyle
                              handler:^(__unused UIAlertAction *action) {
                                switch (type) {
                                  case ABI47_0_0RCTAlertViewStylePlainTextInput:
                                  case ABI47_0_0RCTAlertViewStyleSecureTextInput:
                                    callback(@[ buttonKey, [weakAlertController.textFields.firstObject text] ]);
                                    [weakAlertController hide];
                                    break;
                                  case ABI47_0_0RCTAlertViewStyleLoginAndPasswordInput: {
                                    NSDictionary<NSString *, NSString *> *loginCredentials = @{
                                      @"login" : [weakAlertController.textFields.firstObject text],
                                      @"password" : [weakAlertController.textFields.lastObject text]
                                    };
                                    callback(@[ buttonKey, loginCredentials ]);
                                    [weakAlertController hide];
                                    break;
                                  }
                                  case ABI47_0_0RCTAlertViewStyleDefault:
                                    callback(@[ buttonKey ]);
                                    [weakAlertController hide];
                                    break;
                                }
                              }]];
  }

  if (!_alertControllers) {
    _alertControllers = [NSHashTable weakObjectsHashTable];
  }
  [_alertControllers addObject:alertController];

  dispatch_async(dispatch_get_main_queue(), ^{
    [alertController show:YES completion:nil];
  });
}

- (std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::TurboModule>)getTurboModule:
    (const ABI47_0_0facebook::ABI47_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI47_0_0facebook::ABI47_0_0React::NativeAlertManagerSpecJSI>(params);
}

@end

Class ABI47_0_0RCTAlertManagerCls(void)
{
  return ABI47_0_0RCTAlertManager.class;
}
