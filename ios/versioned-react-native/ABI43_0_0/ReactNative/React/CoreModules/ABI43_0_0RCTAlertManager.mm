/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTAlertManager.h"

#import <ABI43_0_0FBReactNativeSpec/ABI43_0_0FBReactNativeSpec.h>
#import <ABI43_0_0RCTTypeSafety/ABI43_0_0RCTConvertHelpers.h>
#import <ABI43_0_0React/ABI43_0_0RCTAssert.h>
#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTLog.h>
#import <ABI43_0_0React/ABI43_0_0RCTUtils.h>

#import "ABI43_0_0CoreModulesPlugins.h"
#import "ABI43_0_0RCTAlertController.h"

@implementation ABI43_0_0RCTConvert (UIAlertViewStyle)

ABI43_0_0RCT_ENUM_CONVERTER(
    ABI43_0_0RCTAlertViewStyle,
    (@{
      @"default" : @(ABI43_0_0RCTAlertViewStyleDefault),
      @"secure-text" : @(ABI43_0_0RCTAlertViewStyleSecureTextInput),
      @"plain-text" : @(ABI43_0_0RCTAlertViewStylePlainTextInput),
      @"login-password" : @(ABI43_0_0RCTAlertViewStyleLoginAndPasswordInput),
    }),
    ABI43_0_0RCTAlertViewStyleDefault,
    integerValue)

@end

@interface ABI43_0_0RCTAlertManager () <ABI43_0_0NativeAlertManagerSpec>

@end

@implementation ABI43_0_0RCTAlertManager {
  NSHashTable *_alertControllers;
}

ABI43_0_0RCT_EXPORT_MODULE()

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
ABI43_0_0RCT_EXPORT_METHOD(alertWithArgs : (JS::NativeAlertManager::Args &)args callback : (ABI43_0_0RCTResponseSenderBlock)callback)
{
  NSString *title = [ABI43_0_0RCTConvert NSString:args.title()];
  NSString *message = [ABI43_0_0RCTConvert NSString:args.message()];
  ABI43_0_0RCTAlertViewStyle type = [ABI43_0_0RCTConvert ABI43_0_0RCTAlertViewStyle:args.type()];
  NSArray<NSDictionary *> *buttons =
      [ABI43_0_0RCTConvert NSDictionaryArray:ABI43_0_0RCTConvertOptionalVecToArray(args.buttons(), ^id(id<NSObject> element) {
                    return element;
                  })];
  NSString *defaultValue = [ABI43_0_0RCTConvert NSString:args.defaultValue()];
  NSString *cancelButtonKey = [ABI43_0_0RCTConvert NSString:args.cancelButtonKey()];
  NSString *destructiveButtonKey = [ABI43_0_0RCTConvert NSString:args.destructiveButtonKey()];
  UIKeyboardType keyboardType = [ABI43_0_0RCTConvert UIKeyboardType:args.keyboardType()];

  if (!title && !message) {
    ABI43_0_0RCTLogError(@"Must specify either an alert title, or message, or both");
    return;
  }

  if (buttons.count == 0) {
    if (type == ABI43_0_0RCTAlertViewStyleDefault) {
      buttons = @[ @{@"0" : ABI43_0_0RCTUIKitLocalizedString(@"OK")} ];
      cancelButtonKey = @"0";
    } else {
      buttons = @[
        @{@"0" : ABI43_0_0RCTUIKitLocalizedString(@"OK")},
        @{@"1" : ABI43_0_0RCTUIKitLocalizedString(@"Cancel")},
      ];
      cancelButtonKey = @"1";
    }
  }

  ABI43_0_0RCTAlertController *alertController = [ABI43_0_0RCTAlertController alertControllerWithTitle:title
                                                                             message:nil
                                                                      preferredStyle:UIAlertControllerStyleAlert];
  switch (type) {
    case ABI43_0_0RCTAlertViewStylePlainTextInput: {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.secureTextEntry = NO;
        textField.text = defaultValue;
        textField.keyboardType = keyboardType;
      }];
      break;
    }
    case ABI43_0_0RCTAlertViewStyleSecureTextInput: {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = ABI43_0_0RCTUIKitLocalizedString(@"Password");
        textField.secureTextEntry = YES;
        textField.text = defaultValue;
        textField.keyboardType = keyboardType;
      }];
      break;
    }
    case ABI43_0_0RCTAlertViewStyleLoginAndPasswordInput: {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = ABI43_0_0RCTUIKitLocalizedString(@"Login");
        textField.text = defaultValue;
        textField.keyboardType = keyboardType;
      }];
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = ABI43_0_0RCTUIKitLocalizedString(@"Password");
        textField.secureTextEntry = YES;
      }];
      break;
    }
    case ABI43_0_0RCTAlertViewStyleDefault:
      break;
  }

  alertController.message = message;

  for (NSDictionary<NSString *, id> *button in buttons) {
    if (button.count != 1) {
      ABI43_0_0RCTLogError(@"Button definitions should have exactly one key.");
    }
    NSString *buttonKey = button.allKeys.firstObject;
    NSString *buttonTitle = [ABI43_0_0RCTConvert NSString:button[buttonKey]];
    UIAlertActionStyle buttonStyle = UIAlertActionStyleDefault;
    if ([buttonKey isEqualToString:cancelButtonKey]) {
      buttonStyle = UIAlertActionStyleCancel;
    } else if ([buttonKey isEqualToString:destructiveButtonKey]) {
      buttonStyle = UIAlertActionStyleDestructive;
    }
    __weak ABI43_0_0RCTAlertController *weakAlertController = alertController;
    [alertController
        addAction:[UIAlertAction
                      actionWithTitle:buttonTitle
                                style:buttonStyle
                              handler:^(__unused UIAlertAction *action) {
                                switch (type) {
                                  case ABI43_0_0RCTAlertViewStylePlainTextInput:
                                  case ABI43_0_0RCTAlertViewStyleSecureTextInput:
                                    callback(@[ buttonKey, [weakAlertController.textFields.firstObject text] ]);
                                    break;
                                  case ABI43_0_0RCTAlertViewStyleLoginAndPasswordInput: {
                                    NSDictionary<NSString *, NSString *> *loginCredentials = @{
                                      @"login" : [weakAlertController.textFields.firstObject text],
                                      @"password" : [weakAlertController.textFields.lastObject text]
                                    };
                                    callback(@[ buttonKey, loginCredentials ]);
                                    break;
                                  }
                                  case ABI43_0_0RCTAlertViewStyleDefault:
                                    callback(@[ buttonKey ]);
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

- (std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::TurboModule>)getTurboModule:
    (const ABI43_0_0facebook::ABI43_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI43_0_0facebook::ABI43_0_0React::NativeAlertManagerSpecJSI>(params);
}

@end

Class ABI43_0_0RCTAlertManagerCls(void)
{
  return ABI43_0_0RCTAlertManager.class;
}
