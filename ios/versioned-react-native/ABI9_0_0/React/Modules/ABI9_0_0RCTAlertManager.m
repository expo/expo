/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTAlertManager.h"

#import "ABI9_0_0RCTAssert.h"
#import "ABI9_0_0RCTConvert.h"
#import "ABI9_0_0RCTLog.h"
#import "ABI9_0_0RCTUtils.h"

@implementation ABI9_0_0RCTConvert (UIAlertViewStyle)

ABI9_0_0RCT_ENUM_CONVERTER(UIAlertViewStyle, (@{
  @"default": @(UIAlertViewStyleDefault),
  @"secure-text": @(UIAlertViewStyleSecureTextInput),
  @"plain-text": @(UIAlertViewStylePlainTextInput),
  @"login-password": @(UIAlertViewStyleLoginAndPasswordInput),
}), UIAlertViewStyleDefault, integerValue)

@end

@interface ABI9_0_0RCTAlertManager() <UIAlertViewDelegate>

@end

@implementation ABI9_0_0RCTAlertManager
{
  NSMutableArray<UIAlertView *> *_alerts;
  NSMutableArray<UIAlertController *> *_alertControllers;
  NSMutableArray<ABI9_0_0RCTResponseSenderBlock> *_alertCallbacks;
  NSMutableArray<NSArray<NSString *> *> *_alertButtonKeys;
}

ABI9_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  for (UIAlertView *alert in _alerts) {
    [alert dismissWithClickedButtonIndex:0 animated:YES];
  }
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
ABI9_0_0RCT_EXPORT_METHOD(alertWithArgs:(NSDictionary *)args
                  callback:(ABI9_0_0RCTResponseSenderBlock)callback)
{
  NSString *title = [ABI9_0_0RCTConvert NSString:args[@"title"]];
  NSString *message = [ABI9_0_0RCTConvert NSString:args[@"message"]];
  UIAlertViewStyle type = [ABI9_0_0RCTConvert UIAlertViewStyle:args[@"type"]];
  NSArray<NSDictionary *> *buttons = [ABI9_0_0RCTConvert NSDictionaryArray:args[@"buttons"]];
  NSString *defaultValue = [ABI9_0_0RCTConvert NSString:args[@"defaultValue"]];
  NSString *cancelButtonKey = [ABI9_0_0RCTConvert NSString:args[@"cancelButtonKey"]];
  NSString *destructiveButtonKey = [ABI9_0_0RCTConvert NSString:args[@"destructiveButtonKey"]];

  if (!title && !message) {
    ABI9_0_0RCTLogError(@"Must specify either an alert title, or message, or both");
    return;
  }

  if (buttons.count == 0) {
    if (type == UIAlertViewStyleDefault) {
      buttons = @[@{@"0": ABI9_0_0RCTUIKitLocalizedString(@"OK")}];
      cancelButtonKey = @"0";
    } else {
      buttons = @[
        @{@"0": ABI9_0_0RCTUIKitLocalizedString(@"OK")},
        @{@"1": ABI9_0_0RCTUIKitLocalizedString(@"Cancel")},
      ];
      cancelButtonKey = @"1";
    }
  }

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

  // TODO: we've encountered some bug when presenting alerts on top of a window
  // that is subsequently dismissed. As a temporary solution to this, we'll use
  // UIAlertView preferentially if it's available and supports our use case.
  BOOL preferAlertView = (!ABI9_0_0RCTRunningInAppExtension() &&
                          !destructiveButtonKey &&
                          UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone);

  if (preferAlertView || [UIAlertController class] == nil) {

    UIAlertView *alertView = ABI9_0_0RCTAlertView(title, nil, self, nil, nil);
    alertView.alertViewStyle = type;
    alertView.message = message;

    if (type != UIAlertViewStyleDefault) {
      [alertView textFieldAtIndex:0].text = defaultValue;
    }

    NSMutableArray<NSString *> *buttonKeys =
      [[NSMutableArray alloc] initWithCapacity:buttons.count];

    NSInteger index = 0;
    for (NSDictionary<NSString *, id> *button in buttons) {
      if (button.count != 1) {
        ABI9_0_0RCTLogError(@"Button definitions should have exactly one key.");
      }
      NSString *buttonKey = button.allKeys.firstObject;
      NSString *buttonTitle = [ABI9_0_0RCTConvert NSString:button[buttonKey]];
      [alertView addButtonWithTitle:buttonTitle];
      if ([buttonKey isEqualToString:cancelButtonKey]) {
        alertView.cancelButtonIndex = buttonKeys.count;
      }
      [buttonKeys addObject:buttonKey];
      index ++;
    }

    if (!_alerts) {
      _alerts = [NSMutableArray new];
      _alertCallbacks = [NSMutableArray new];
      _alertButtonKeys = [NSMutableArray new];
    }
    [_alerts addObject:alertView];
    [_alertCallbacks addObject:callback ?: ^(__unused id unused) {}];
    [_alertButtonKeys addObject:buttonKeys];

    [alertView show];

  } else

#endif

  {
    UIViewController *presentingController = ABI9_0_0RCTPresentedViewController();
    if (presentingController == nil) {
      ABI9_0_0RCTLogError(@"Tried to display alert view but there is no application window. args: %@", args);
      return;
    }

    UIAlertController *alertController =
      [UIAlertController alertControllerWithTitle:title
                                          message:nil
                                   preferredStyle:UIAlertControllerStyleAlert];
    switch (type) {
      case UIAlertViewStylePlainTextInput: {
        [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
          textField.secureTextEntry = NO;
          textField.text = defaultValue;
        }];
        break;
      }
      case UIAlertViewStyleSecureTextInput: {
        [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
          textField.placeholder = ABI9_0_0RCTUIKitLocalizedString(@"Password");
          textField.secureTextEntry = YES;
          textField.text = defaultValue;
        }];
        break;
      }
      case UIAlertViewStyleLoginAndPasswordInput: {
        [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
          textField.placeholder = ABI9_0_0RCTUIKitLocalizedString(@"Login");
          textField.text = defaultValue;
        }];
        [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
          textField.placeholder = ABI9_0_0RCTUIKitLocalizedString(@"Password");
          textField.secureTextEntry = YES;
        }];
        break;
      }
      case UIAlertViewStyleDefault:
        break;
    }

    alertController.message = message;

    for (NSDictionary<NSString *, id> *button in buttons) {
      if (button.count != 1) {
        ABI9_0_0RCTLogError(@"Button definitions should have exactly one key.");
      }
      NSString *buttonKey = button.allKeys.firstObject;
      NSString *buttonTitle = [ABI9_0_0RCTConvert NSString:button[buttonKey]];
      UIAlertActionStyle buttonStyle = UIAlertActionStyleDefault;
      if ([buttonKey isEqualToString:cancelButtonKey]) {
        buttonStyle = UIAlertActionStyleCancel;
      } else if ([buttonKey isEqualToString:destructiveButtonKey]) {
        buttonStyle = UIAlertActionStyleDestructive;
      }
      [alertController addAction:[UIAlertAction actionWithTitle:buttonTitle
                                                          style:buttonStyle
                                                        handler:^(__unused UIAlertAction *action) {
        switch (type) {
          case UIAlertViewStylePlainTextInput:
          case UIAlertViewStyleSecureTextInput:
            callback(@[buttonKey, [alertController.textFields.firstObject text]]);
            break;
          case UIAlertViewStyleLoginAndPasswordInput: {
            NSDictionary<NSString *, NSString *> *loginCredentials = @{
              @"login": [alertController.textFields.firstObject text],
              @"password": [alertController.textFields.lastObject text]
            };
            callback(@[buttonKey, loginCredentials]);
            break;
          }
          case UIAlertViewStyleDefault:
            callback(@[buttonKey]);
            break;
        }
      }]];
    }

    if (!_alertControllers) {
      _alertControllers = [NSMutableArray new];
    }
    [_alertControllers addObject:alertController];

    [presentingController presentViewController:alertController animated:YES completion:nil];
  }
}

#pragma mark - UIAlertViewDelegate

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
  NSUInteger index = [_alerts indexOfObject:alertView];
  ABI9_0_0RCTAssert(index != NSNotFound, @"Dismissed alert was not recognised");

  ABI9_0_0RCTResponseSenderBlock callback = _alertCallbacks[index];
  NSArray<NSString *> *buttonKeys = _alertButtonKeys[index];

  switch (alertView.alertViewStyle) {
    case UIAlertViewStylePlainTextInput:
    case UIAlertViewStyleSecureTextInput:
      callback(@[buttonKeys[buttonIndex], [alertView textFieldAtIndex:0].text]);
      break;
    case UIAlertViewStyleLoginAndPasswordInput: {
      NSDictionary<NSString *, NSString *> *loginCredentials = @{
        @"login": [alertView textFieldAtIndex:0].text,
        @"password": [alertView textFieldAtIndex:1].text,
      };
      callback(@[buttonKeys[buttonIndex], loginCredentials]);
      break;
    }
    case UIAlertViewStyleDefault:
      callback(@[buttonKeys[buttonIndex]]);
      break;
  }

  [_alerts removeObjectAtIndex:index];
  [_alertCallbacks removeObjectAtIndex:index];
  [_alertButtonKeys removeObjectAtIndex:index];
}

@end
