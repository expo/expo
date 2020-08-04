/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTDevMenu.h>

#import <ABI38_0_0FBReactNativeSpec/ABI38_0_0FBReactNativeSpec.h>
#import <ABI38_0_0React/ABI38_0_0RCTBridge+Private.h>
#import <ABI38_0_0React/ABI38_0_0RCTBundleURLProvider.h>
#import <ABI38_0_0React/ABI38_0_0RCTDefines.h>
#import <ABI38_0_0React/ABI38_0_0RCTDevSettings.h>
#import <ABI38_0_0React/ABI38_0_0RCTKeyCommands.h>
#import <ABI38_0_0React/ABI38_0_0RCTLog.h>
#import <ABI38_0_0React/ABI38_0_0RCTReloadCommand.h>
#import <ABI38_0_0React/ABI38_0_0RCTUtils.h>

#import "ABI38_0_0CoreModulesPlugins.h"

#if ABI38_0_0RCT_DEV_MENU

#if ABI38_0_0RCT_ENABLE_INSPECTOR
#import <ABI38_0_0React/ABI38_0_0RCTInspectorDevServerHelper.h>
#endif

NSString *const ABI38_0_0RCTShowDevMenuNotification = @"ABI38_0_0RCTShowDevMenuNotification";

@implementation UIWindow (ABI38_0_0RCTDevMenu)

- (void)ABI38_0_0RCT_motionEnded:(__unused UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI38_0_0RCTShowDevMenuNotification object:nil];
  }
}

@end

@implementation ABI38_0_0RCTDevMenuItem {
  ABI38_0_0RCTDevMenuItemTitleBlock _titleBlock;
  dispatch_block_t _handler;
}

- (instancetype)initWithTitleBlock:(ABI38_0_0RCTDevMenuItemTitleBlock)titleBlock handler:(dispatch_block_t)handler
{
  if ((self = [super init])) {
    _titleBlock = [titleBlock copy];
    _handler = [handler copy];
  }
  return self;
}

ABI38_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

+ (instancetype)buttonItemWithTitleBlock:(NSString * (^)(void))titleBlock handler:(dispatch_block_t)handler
{
  return [[self alloc] initWithTitleBlock:titleBlock handler:handler];
}

+ (instancetype)buttonItemWithTitle:(NSString *)title handler:(dispatch_block_t)handler
{
  return [[self alloc]
      initWithTitleBlock:^NSString * {
        return title;
      }
                 handler:handler];
}

- (void)callHandler
{
  if (_handler) {
    _handler();
  }
}

- (NSString *)title
{
  if (_titleBlock) {
    return _titleBlock();
  }
  return nil;
}

@end

typedef void (^ABI38_0_0RCTDevMenuAlertActionHandler)(UIAlertAction *action);

@interface ABI38_0_0RCTDevMenu () <ABI38_0_0RCTBridgeModule, ABI38_0_0RCTInvalidating, NativeDevMenuSpec>

@end

@implementation ABI38_0_0RCTDevMenu {
  UIAlertController *_actionSheet;
  NSMutableArray<ABI38_0_0RCTDevMenuItem *> *_extraMenuItems;
}

@synthesize bridge = _bridge;

+ (NSString *)moduleName { return @"ABI38_0_0RCTDevMenu"; }

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(showOnShake)
                                                 name:ABI38_0_0RCTShowDevMenuNotification
                                               object:nil];
    _extraMenuItems = [NSMutableArray new];

#if TARGET_OS_SIMULATOR
    ABI38_0_0RCTKeyCommands *commands = [ABI38_0_0RCTKeyCommands sharedInstance];
    __weak __typeof(self) weakSelf = self;

    // Toggle debug menu
    [commands registerKeyCommandWithInput:@"d"
                            modifierFlags:UIKeyModifierCommand
                                   action:^(__unused UIKeyCommand *command) {
                                     [weakSelf toggle];
                                   }];

    // Toggle element inspector
    [commands registerKeyCommandWithInput:@"i"
                            modifierFlags:UIKeyModifierCommand
                                   action:^(__unused UIKeyCommand *command) {
                                     [weakSelf.bridge.devSettings toggleElementInspector];
                                   }];

    // Reload in normal mode
    [commands registerKeyCommandWithInput:@"n"
                            modifierFlags:UIKeyModifierCommand
                                   action:^(__unused UIKeyCommand *command) {
                                     [weakSelf.bridge.devSettings setIsDebuggingRemotely:NO];
                                   }];
#endif
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  _presentedItems = nil;
  [_actionSheet dismissViewControllerAnimated:YES
                                   completion:^(void){}];
}

- (void)showOnShake
{
  if ([_bridge.devSettings isShakeToShowDevMenuEnabled]) {
    [self show];
  }
}

- (void)toggle
{
  if (_actionSheet) {
    [_actionSheet dismissViewControllerAnimated:YES
                                     completion:^(void){
                                     }];
    _actionSheet = nil;
  } else {
    [self show];
  }
}

- (BOOL)isActionSheetShown
{
  return _actionSheet != nil;
}

- (void)addItem:(NSString *)title handler:(void (^)(void))handler
{
  [self addItem:[ABI38_0_0RCTDevMenuItem buttonItemWithTitle:title handler:handler]];
}

- (void)addItem:(ABI38_0_0RCTDevMenuItem *)item
{
  [_extraMenuItems addObject:item];
}

- (void)setDefaultJSBundle
{
  [[ABI38_0_0RCTBundleURLProvider sharedSettings] resetToDefaults];
  self->_bridge.bundleURL = [[ABI38_0_0RCTBundleURLProvider sharedSettings] jsBundleURLForFallbackResource:nil
                                                                                fallbackExtension:nil];
  ABI38_0_0RCTTriggerReloadCommandListeners(@"Dev menu - reset to default");
}

- (NSArray<ABI38_0_0RCTDevMenuItem *> *)_menuItemsToPresent
{
  NSMutableArray<ABI38_0_0RCTDevMenuItem *> *items = [NSMutableArray new];

  // Add built-in items
  __weak ABI38_0_0RCTBridge *bridge = _bridge;
  __weak ABI38_0_0RCTDevSettings *devSettings = _bridge.devSettings;
  __weak ABI38_0_0RCTDevMenu *weakSelf = self;

  [items addObject:[ABI38_0_0RCTDevMenuItem buttonItemWithTitle:@"Reload"
                                               handler:^{
                                                 ABI38_0_0RCTTriggerReloadCommandListeners(@"Dev menu - reload");
                                               }]];

  if (!devSettings.isProfilingEnabled) {
    if (!devSettings.isRemoteDebuggingAvailable) {
      [items
          addObject:[ABI38_0_0RCTDevMenuItem
                        buttonItemWithTitle:@"Debugger Unavailable"
                                    handler:^{
                                      NSString *message = ABI38_0_0RCTTurboModuleEnabled()
                                          ? @"Debugging is not currently supported when TurboModule is enabled."
                                          : @"Include the ABI38_0_0RCTWebSocket library to enable JavaScript debugging.";
                                      UIAlertController *alertController =
                                          [UIAlertController alertControllerWithTitle:@"Debugger Unavailable"
                                                                              message:message
                                                                       preferredStyle:UIAlertControllerStyleAlert];
                                      __weak __typeof__(alertController) weakAlertController = alertController;
                                      [alertController
                                          addAction:[UIAlertAction actionWithTitle:@"OK"
                                                                             style:UIAlertActionStyleDefault
                                                                           handler:^(__unused UIAlertAction *action) {
                                                                             [weakAlertController
                                                                                 dismissViewControllerAnimated:YES
                                                                                                    completion:nil];
                                                                           }]];
                                      [ABI38_0_0RCTPresentedViewController() presentViewController:alertController
                                                                                 animated:YES
                                                                               completion:NULL];
                                    }]];
    } else {
      [items addObject:[ABI38_0_0RCTDevMenuItem
                           buttonItemWithTitleBlock:^NSString * {
                             if (devSettings.isNuclideDebuggingAvailable) {
                               return devSettings.isDebuggingRemotely ? @"Stop Chrome Debugger" : @"Debug with Chrome";
                             } else {
                               return devSettings.isDebuggingRemotely ? @"Stop Debugging" : @"Debug";
                             }
                           }
                           handler:^{
                             devSettings.isDebuggingRemotely = !devSettings.isDebuggingRemotely;
                           }]];
    }

    if (devSettings.isNuclideDebuggingAvailable && !devSettings.isDebuggingRemotely) {
      [items addObject:[ABI38_0_0RCTDevMenuItem buttonItemWithTitle:@"Debug with Nuclide"
                                                   handler:^{
#if ABI38_0_0RCT_ENABLE_INSPECTOR
                                                     [ABI38_0_0RCTInspectorDevServerHelper
                                                         attachDebugger:@"ABI38_0_0ReactNative"
                                                          withBundleURL:bridge.bundleURL
                                                               withView:ABI38_0_0RCTPresentedViewController()];
#endif
                                                   }]];
    }
  }

  [items addObject:[ABI38_0_0RCTDevMenuItem
                       buttonItemWithTitleBlock:^NSString * {
                         return devSettings.isElementInspectorShown ? @"Hide Inspector" : @"Show Inspector";
                       }
                       handler:^{
                         [devSettings toggleElementInspector];
                       }]];

  if (devSettings.isHotLoadingAvailable) {
    [items addObject:[ABI38_0_0RCTDevMenuItem
                         buttonItemWithTitleBlock:^NSString * {
                           // Previously known as "Hot Reloading". We won't use this term anymore.
                           return devSettings.isHotLoadingEnabled ? @"Disable Fast Refresh" : @"Enable Fast Refresh";
                         }
                         handler:^{
                           devSettings.isHotLoadingEnabled = !devSettings.isHotLoadingEnabled;
                         }]];
  }

  if (devSettings.isLiveReloadAvailable) {
    [items addObject:[ABI38_0_0RCTDevMenuItem
                         buttonItemWithTitleBlock:^NSString * {
                           return devSettings.isDebuggingRemotely
                               ? @"Systrace Unavailable"
                               : devSettings.isProfilingEnabled ? @"Stop Systrace" : @"Start Systrace";
                         }
                         handler:^{
                           if (devSettings.isDebuggingRemotely) {
                             UIAlertController *alertController =
                                 [UIAlertController alertControllerWithTitle:@"Systrace Unavailable"
                                                                     message:@"Stop debugging to enable Systrace."
                                                              preferredStyle:UIAlertControllerStyleAlert];
                             __weak __typeof__(alertController) weakAlertController = alertController;
                             [alertController
                                 addAction:[UIAlertAction actionWithTitle:@"OK"
                                                                    style:UIAlertActionStyleDefault
                                                                  handler:^(__unused UIAlertAction *action) {
                                                                    [weakAlertController
                                                                        dismissViewControllerAnimated:YES
                                                                                           completion:nil];
                                                                  }]];
                             [ABI38_0_0RCTPresentedViewController() presentViewController:alertController
                                                                        animated:YES
                                                                      completion:NULL];
                           } else {
                             devSettings.isProfilingEnabled = !devSettings.isProfilingEnabled;
                           }
                         }]];
    // "Live reload" which refreshes on every edit was removed in favor of "Fast Refresh".
    // While native code for "Live reload" is still there, please don't add the option back.
    // See D15958697 for more context.
  }

  [items
      addObject:[ABI38_0_0RCTDevMenuItem
                    buttonItemWithTitleBlock:^NSString * {
                      return @"Configure Bundler";
                    }
                    handler:^{
                      UIAlertController *alertController = [UIAlertController
                          alertControllerWithTitle:@"Configure Bundler"
                                           message:@"Provide a custom bundler address, port, and entrypoint."
                                    preferredStyle:UIAlertControllerStyleAlert];
                      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
                        textField.placeholder = @"0.0.0.0";
                      }];
                      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
                        textField.placeholder = @"8081";
                      }];
                      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
                        textField.placeholder = @"index";
                      }];
                      [alertController
                          addAction:[UIAlertAction
                                        actionWithTitle:@"Apply Changes"
                                                  style:UIAlertActionStyleDefault
                                                handler:^(__unused UIAlertAction *action) {
                                                  NSArray *textfields = alertController.textFields;
                                                  UITextField *ipTextField = textfields[0];
                                                  UITextField *portTextField = textfields[1];
                                                  UITextField *bundleRootTextField = textfields[2];
                                                  NSString *bundleRoot = bundleRootTextField.text;
                                                  if (ipTextField.text.length == 0 && portTextField.text.length == 0) {
                                                    [weakSelf setDefaultJSBundle];
                                                    return;
                                                  }
                                                  NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
                                                  formatter.numberStyle = NSNumberFormatterDecimalStyle;
                                                  NSNumber *portNumber =
                                                      [formatter numberFromString:portTextField.text];
                                                  if (portNumber == nil) {
                                                    portNumber = [NSNumber numberWithInt:ABI38_0_0RCT_METRO_PORT];
                                                  }
                                                  [ABI38_0_0RCTBundleURLProvider sharedSettings].jsLocation = [NSString
                                                      stringWithFormat:@"%@:%d", ipTextField.text, portNumber.intValue];
                                                  __strong ABI38_0_0RCTBridge *strongBridge = bridge;
                                                  if (strongBridge) {
                                                    NSURL *bundleURL = bundleRoot.length
                                                        ? [[ABI38_0_0RCTBundleURLProvider sharedSettings]
                                                              jsBundleURLForBundleRoot:bundleRoot
                                                                      fallbackResource:nil]
                                                        : [strongBridge.delegate sourceURLForBridge:strongBridge];
                                                    strongBridge.bundleURL = bundleURL;
                                                    ABI38_0_0RCTTriggerReloadCommandListeners(@"Dev menu - apply changes");
                                                  }
                                                }]];
                      [alertController addAction:[UIAlertAction actionWithTitle:@"Reset to Default"
                                                                          style:UIAlertActionStyleDefault
                                                                        handler:^(__unused UIAlertAction *action) {
                                                                          [weakSelf setDefaultJSBundle];
                                                                        }]];
                      [alertController addAction:[UIAlertAction actionWithTitle:@"Cancel"
                                                                          style:UIAlertActionStyleCancel
                                                                        handler:^(__unused UIAlertAction *action) {
                                                                          return;
                                                                        }]];
                      [ABI38_0_0RCTPresentedViewController() presentViewController:alertController animated:YES completion:NULL];
                    }]];

  [items addObjectsFromArray:_extraMenuItems];
  return items;
}

ABI38_0_0RCT_EXPORT_METHOD(show)
{
  if (_actionSheet || !_bridge || ABI38_0_0RCTRunningInAppExtension()) {
    return;
  }

  NSString *bridgeDescription = _bridge.bridgeDescription;
  NSString *description =
      bridgeDescription.length > 0 ? [NSString stringWithFormat:@"Running %@", bridgeDescription] : nil;

  // On larger devices we don't have an anchor point for the action sheet
  UIAlertControllerStyle style = [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone
      ? UIAlertControllerStyleActionSheet
      : UIAlertControllerStyleAlert;
  _actionSheet = [UIAlertController alertControllerWithTitle:@"ABI38_0_0React Native Debug Menu"
                                                     message:description
                                              preferredStyle:style];

  NSArray<ABI38_0_0RCTDevMenuItem *> *items = [self _menuItemsToPresent];
  for (ABI38_0_0RCTDevMenuItem *item in items) {
    [_actionSheet addAction:[UIAlertAction actionWithTitle:item.title
                                                     style:UIAlertActionStyleDefault
                                                   handler:[self alertActionHandlerForDevItem:item]]];
  }

  [_actionSheet addAction:[UIAlertAction actionWithTitle:@"Cancel"
                                                   style:UIAlertActionStyleCancel
                                                 handler:[self alertActionHandlerForDevItem:nil]]];

  _presentedItems = items;
  [ABI38_0_0RCTPresentedViewController() presentViewController:_actionSheet animated:YES completion:nil];

  [_bridge enqueueJSCall:@"ABI38_0_0RCTNativeAppEventEmitter"
                  method:@"emit"
                    args:@[@"ABI38_0_0RCTDevMenuShown"]
              completion:NULL];
}

- (ABI38_0_0RCTDevMenuAlertActionHandler)alertActionHandlerForDevItem:(ABI38_0_0RCTDevMenuItem *__nullable)item
{
  return ^(__unused UIAlertAction *action) {
    if (item) {
      [item callHandler];
    }

    self->_actionSheet = nil;
  };
}

#pragma mark - deprecated methods and properties

#define WARN_DEPRECATED_DEV_MENU_EXPORT() \
  ABI38_0_0RCTLogWarn(@"Using deprecated method %s, use ABI38_0_0RCTDevSettings instead", __func__)

- (void)setShakeToShow:(BOOL)shakeToShow
{
  _bridge.devSettings.isShakeToShowDevMenuEnabled = shakeToShow;
}

- (BOOL)shakeToShow
{
  return _bridge.devSettings.isShakeToShowDevMenuEnabled;
}

ABI38_0_0RCT_EXPORT_METHOD(reload)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  ABI38_0_0RCTTriggerReloadCommandListeners(@"Unknown from JS");
}

ABI38_0_0RCT_EXPORT_METHOD(debugRemotely : (BOOL)enableDebug)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  _bridge.devSettings.isDebuggingRemotely = enableDebug;
}

ABI38_0_0RCT_EXPORT_METHOD(setProfilingEnabled : (BOOL)enabled)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  _bridge.devSettings.isProfilingEnabled = enabled;
}

- (BOOL)profilingEnabled
{
  return _bridge.devSettings.isProfilingEnabled;
}

ABI38_0_0RCT_EXPORT_METHOD(setHotLoadingEnabled : (BOOL)enabled)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  _bridge.devSettings.isHotLoadingEnabled = enabled;
}

- (BOOL)hotLoadingEnabled
{
  return _bridge.devSettings.isHotLoadingEnabled;
}

- (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI38_0_0facebook::ABI38_0_0React::NativeDevMenuSpecJSI>(self, jsInvoker);
}

@end

#else // Unavailable when not in dev mode

@interface ABI38_0_0RCTDevMenu() <NativeDevMenuSpec>
@end

@implementation ABI38_0_0RCTDevMenu

- (void)show
{
}
- (void)reload
{
}
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler
{
}
- (void)addItem:(ABI38_0_0RCTDevMenu *)item
{
}

- (void)debugRemotely : (BOOL)enableDebug
{
}

- (BOOL)isActionSheetShown
{
  return NO;
}
+ (NSString *)moduleName
{
  return @"DevMenu";
}

- (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI38_0_0facebook::ABI38_0_0React::NativeDevMenuSpecJSI>(self, jsInvoker);
}

@end

@implementation ABI38_0_0RCTDevMenuItem

+ (instancetype)buttonItemWithTitle:(NSString *)title handler:(void (^)(void))handler
{
  return nil;
}
+ (instancetype)buttonItemWithTitleBlock:(NSString * (^)(void))titleBlock handler:(void (^)(void))handler
{
  return nil;
}

@end

#endif

@implementation ABI38_0_0RCTBridge (ABI38_0_0RCTDevMenu)

- (ABI38_0_0RCTDevMenu *)devMenu
{
#if ABI38_0_0RCT_DEV_MENU
  return [self moduleForClass:[ABI38_0_0RCTDevMenu class]];
#else
  return nil;
#endif
}

@end

Class ABI38_0_0RCTDevMenuCls(void) {
  return ABI38_0_0RCTDevMenu.class;
}
