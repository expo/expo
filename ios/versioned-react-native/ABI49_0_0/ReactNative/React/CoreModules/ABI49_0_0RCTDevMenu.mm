/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTDevMenu.h>

#import <ABI49_0_0FBReactNativeSpec/ABI49_0_0FBReactNativeSpec.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge+Private.h>
#import <ABI49_0_0React/ABI49_0_0RCTBundleURLProvider.h>
#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>
#import <ABI49_0_0React/ABI49_0_0RCTDevSettings.h>
#import <ABI49_0_0React/ABI49_0_0RCTKeyCommands.h>
#import <ABI49_0_0React/ABI49_0_0RCTLog.h>
#import <ABI49_0_0React/ABI49_0_0RCTReloadCommand.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#import "ABI49_0_0CoreModulesPlugins.h"

#if ABI49_0_0RCT_DEV_MENU
#if ABI49_0_0RCT_ENABLE_INSPECTOR
#import <ABI49_0_0React/ABI49_0_0RCTInspectorDevServerHelper.h>
#endif

NSString *const ABI49_0_0RCTShowDevMenuNotification = @"ABI49_0_0RCTShowDevMenuNotification";

@implementation UIWindow (ABI49_0_0RCTDevMenu)

- (void)ABI49_0_0RCT_motionEnded:(__unused UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI49_0_0RCTShowDevMenuNotification object:nil];
  }
}

@end

@implementation ABI49_0_0RCTDevMenuItem {
  ABI49_0_0RCTDevMenuItemTitleBlock _titleBlock;
  dispatch_block_t _handler;
}

- (instancetype)initWithTitleBlock:(ABI49_0_0RCTDevMenuItemTitleBlock)titleBlock handler:(dispatch_block_t)handler
{
  if ((self = [super init])) {
    _titleBlock = [titleBlock copy];
    _handler = [handler copy];
  }
  return self;
}

ABI49_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

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

typedef void (^ABI49_0_0RCTDevMenuAlertActionHandler)(UIAlertAction *action);

@interface ABI49_0_0RCTDevMenu () <ABI49_0_0RCTBridgeModule, ABI49_0_0RCTInvalidating, ABI49_0_0NativeDevMenuSpec>

@end

@implementation ABI49_0_0RCTDevMenu {
  UIAlertController *_actionSheet;
  NSMutableArray<ABI49_0_0RCTDevMenuItem *> *_extraMenuItems;
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;
@synthesize callableJSModules = _callableJSModules;
@synthesize bundleManager = _bundleManager;

+ (NSString *)moduleName { return @"ABI49_0_0RCTDevMenu"; }

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(showOnShake)
                                                 name:ABI49_0_0RCTShowDevMenuNotification
                                               object:nil];
    _extraMenuItems = [NSMutableArray new];

    [self registerHotkeys];
  }
  return self;
}

- (void)registerHotkeys
{
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  ABI49_0_0RCTKeyCommands *commands = [ABI49_0_0RCTKeyCommands sharedInstance];
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
                                   [(ABI49_0_0RCTDevSettings *)[weakSelf.moduleRegistry moduleForName:"DevSettings"]
                                       toggleElementInspector];
                                 }];

  // Reload in normal mode
  [commands registerKeyCommandWithInput:@"n"
                          modifierFlags:UIKeyModifierCommand
                                 action:^(__unused UIKeyCommand *command) {
                                   [(ABI49_0_0RCTDevSettings *)[weakSelf.moduleRegistry moduleForName:"DevSettings"]
                                       setIsDebuggingRemotely:NO];
                                 }];
#endif
}

- (void)unregisterHotkeys
{
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  ABI49_0_0RCTKeyCommands *commands = [ABI49_0_0RCTKeyCommands sharedInstance];

  [commands unregisterKeyCommandWithInput:@"d" modifierFlags:UIKeyModifierCommand];
  [commands unregisterKeyCommandWithInput:@"i" modifierFlags:UIKeyModifierCommand];
  [commands unregisterKeyCommandWithInput:@"n" modifierFlags:UIKeyModifierCommand];
#endif
}

- (BOOL)isHotkeysRegistered
{
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  ABI49_0_0RCTKeyCommands *commands = [ABI49_0_0RCTKeyCommands sharedInstance];

  return [commands isKeyCommandRegisteredForInput:@"d" modifierFlags:UIKeyModifierCommand] &&
      [commands isKeyCommandRegisteredForInput:@"i" modifierFlags:UIKeyModifierCommand] &&
      [commands isKeyCommandRegisteredForInput:@"n" modifierFlags:UIKeyModifierCommand];
#else
  return NO;
#endif
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  _presentedItems = nil;
  [_actionSheet dismissViewControllerAnimated:YES
                                   completion:^(void){
                                   }];
}

- (void)showOnShake
{
  if ([((ABI49_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]) isShakeToShowDevMenuEnabled]) {
    for (UIWindow *window in [ABI49_0_0RCTSharedApplication() windows]) {
      NSString *recursiveDescription = [window valueForKey:@"recursiveDescription"];
      if ([recursiveDescription containsString:@"ABI49_0_0RCTView"]) {
        [self show];
        return;
      }
    }
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
  [self addItem:[ABI49_0_0RCTDevMenuItem buttonItemWithTitle:title handler:handler]];
}

- (void)addItem:(ABI49_0_0RCTDevMenuItem *)item
{
  [_extraMenuItems addObject:item];
}

- (void)setDefaultJSBundle
{
  [[ABI49_0_0RCTBundleURLProvider sharedSettings] resetToDefaults];
  self->_bundleManager.bundleURL = [[ABI49_0_0RCTBundleURLProvider sharedSettings] jsBundleURLForFallbackExtension:nil];
  ABI49_0_0RCTTriggerReloadCommandListeners(@"Dev menu - reset to default");
}

- (NSArray<ABI49_0_0RCTDevMenuItem *> *)_menuItemsToPresent
{
  NSMutableArray<ABI49_0_0RCTDevMenuItem *> *items = [NSMutableArray new];

  // Add built-in items
  __weak ABI49_0_0RCTDevSettings *devSettings = [_moduleRegistry moduleForName:"DevSettings"];
  __weak ABI49_0_0RCTDevMenu *weakSelf = self;
  __weak ABI49_0_0RCTBundleManager *bundleManager = _bundleManager;

  [items addObject:[ABI49_0_0RCTDevMenuItem buttonItemWithTitle:@"Reload"
                                               handler:^{
                                                 ABI49_0_0RCTTriggerReloadCommandListeners(@"Dev menu - reload");
                                               }]];

  if (!devSettings.isProfilingEnabled) {
#if ABI49_0_0RCT_ENABLE_INSPECTOR
    if (devSettings.isDeviceDebuggingAvailable) {
      // For on-device debugging we link out to Flipper.
      // Since we're assuming Flipper is available, also include the DevTools.
      // Note: For parity with the Android code.
      [items addObject:[ABI49_0_0RCTDevMenuItem
                           buttonItemWithTitleBlock:^NSString * {
                             return @"Open Debugger";
                           }
                           handler:^{
                             [ABI49_0_0RCTInspectorDevServerHelper
                                          openURL:@"flipper://null/Hermesdebuggerrn?device=ABI49_0_0React%20Native"
                                    withBundleURL:bundleManager.bundleURL
                                 withErrorMessage:@"Failed to open Flipper. Please check that Metro is running."];
                           }]];

      [items addObject:[ABI49_0_0RCTDevMenuItem
                           buttonItemWithTitleBlock:^NSString * {
                             return @"Open ABI49_0_0React DevTools";
                           }
                           handler:^{
                             [ABI49_0_0RCTInspectorDevServerHelper
                                          openURL:@"flipper://null/ABI49_0_0React?device=ABI49_0_0React%20Native"
                                    withBundleURL:bundleManager.bundleURL
                                 withErrorMessage:@"Failed to open Flipper. Please check that Metro is running."];
                           }]];
    } else if (devSettings.isRemoteDebuggingAvailable) {
#else
    if (devSettings.isRemoteDebuggingAvailable) {
#endif
      // For remote debugging, we open up Chrome running the app in a web worker.
      // Note that this requires async communication, which will not work for Turbo Modules.
      [items addObject:[ABI49_0_0RCTDevMenuItem
                           buttonItemWithTitleBlock:^NSString * {
                             return devSettings.isDebuggingRemotely ? @"Stop Debugging" : @"Debug with Chrome";
                           }
                           handler:^{
                             devSettings.isDebuggingRemotely = !devSettings.isDebuggingRemotely;
                           }]];
    } else {
      // If neither are available, we're defaulting to a message that tells you about remote debugging.
      [items
          addObject:[ABI49_0_0RCTDevMenuItem
                        buttonItemWithTitle:@"Debugger Unavailable"
                                    handler:^{
                                      NSString *message = ABI49_0_0RCTTurboModuleEnabled()
                                          ? @"Debugging with Chrome is not supported when TurboModules are enabled."
                                          : @"Include the ABI49_0_0RCTWebSocket library to enable JavaScript debugging.";
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
                                      [ABI49_0_0RCTPresentedViewController() presentViewController:alertController
                                                                                 animated:YES
                                                                               completion:NULL];
                                    }]];
    }
  }

  [items addObject:[ABI49_0_0RCTDevMenuItem
                       buttonItemWithTitleBlock:^NSString * {
                         return devSettings.isElementInspectorShown ? @"Hide Inspector" : @"Show Inspector";
                       }
                       handler:^{
                         [devSettings toggleElementInspector];
                       }]];

  if (devSettings.isHotLoadingAvailable) {
    [items addObject:[ABI49_0_0RCTDevMenuItem
                         buttonItemWithTitleBlock:^NSString * {
                           // Previously known as "Hot Reloading". We won't use this term anymore.
                           return devSettings.isHotLoadingEnabled ? @"Disable Fast Refresh" : @"Enable Fast Refresh";
                         }
                         handler:^{
                           devSettings.isHotLoadingEnabled = !devSettings.isHotLoadingEnabled;
                         }]];
  }

  [items
      addObject:[ABI49_0_0RCTDevMenuItem
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
                                                  NSNumberFormatter *formatter = [NSNumberFormatter new];
                                                  formatter.numberStyle = NSNumberFormatterDecimalStyle;
                                                  NSNumber *portNumber =
                                                      [formatter numberFromString:portTextField.text];
                                                  if (portNumber == nil) {
                                                    portNumber = [NSNumber numberWithInt:ABI49_0_0RCT_METRO_PORT];
                                                  }
                                                  [ABI49_0_0RCTBundleURLProvider sharedSettings].jsLocation = [NSString
                                                      stringWithFormat:@"%@:%d", ipTextField.text, portNumber.intValue];
                                                  if (bundleRoot.length == 0) {
                                                    [bundleManager resetBundleURL];
                                                  } else {
                                                    bundleManager.bundleURL = [[ABI49_0_0RCTBundleURLProvider sharedSettings]
                                                        jsBundleURLForBundleRoot:bundleRoot];
                                                  }

                                                  ABI49_0_0RCTTriggerReloadCommandListeners(@"Dev menu - apply changes");
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
                      [ABI49_0_0RCTPresentedViewController() presentViewController:alertController animated:YES completion:NULL];
                    }]];

  [items addObjectsFromArray:_extraMenuItems];
  return items;
}

ABI49_0_0RCT_EXPORT_METHOD(show)
{
  if (_actionSheet || ABI49_0_0RCTRunningInAppExtension()) {
    return;
  }

  NSString *bridgeDescription = _bridge.bridgeDescription;
  NSString *description =
      bridgeDescription.length > 0 ? [NSString stringWithFormat:@"Running %@", bridgeDescription] : nil;

  // On larger devices we don't have an anchor point for the action sheet
  UIAlertControllerStyle style = [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone
      ? UIAlertControllerStyleActionSheet
      : UIAlertControllerStyleAlert;

  NSString *devMenuType = self.bridge ? @"Bridge" : @"Bridgeless";
  NSString *devMenuTitle = [NSString stringWithFormat:@"ABI49_0_0React Native Dev Menu (%@)", devMenuType];

  _actionSheet = [UIAlertController alertControllerWithTitle:devMenuTitle message:description preferredStyle:style];

  NSArray<ABI49_0_0RCTDevMenuItem *> *items = [self _menuItemsToPresent];
  for (ABI49_0_0RCTDevMenuItem *item in items) {
    [_actionSheet addAction:[UIAlertAction actionWithTitle:item.title
                                                     style:UIAlertActionStyleDefault
                                                   handler:[self alertActionHandlerForDevItem:item]]];
  }

  [_actionSheet addAction:[UIAlertAction actionWithTitle:@"Cancel"
                                                   style:UIAlertActionStyleCancel
                                                 handler:[self alertActionHandlerForDevItem:nil]]];

  _presentedItems = items;
  [ABI49_0_0RCTPresentedViewController() presentViewController:_actionSheet animated:YES completion:nil];

  [_callableJSModules invokeModule:@"ABI49_0_0RCTNativeAppEventEmitter" method:@"emit" withArgs:@[ @"ABI49_0_0RCTDevMenuShown" ]];
}

- (ABI49_0_0RCTDevMenuAlertActionHandler)alertActionHandlerForDevItem:(ABI49_0_0RCTDevMenuItem *__nullable)item
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
  ABI49_0_0RCTLogWarn(@"Using deprecated method %s, use ABI49_0_0RCTDevSettings instead", __func__)

- (void)setShakeToShow:(BOOL)shakeToShow
{
  ((ABI49_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isShakeToShowDevMenuEnabled = shakeToShow;
}

- (BOOL)shakeToShow
{
  return ((ABI49_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isShakeToShowDevMenuEnabled;
}

ABI49_0_0RCT_EXPORT_METHOD(reload)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  ABI49_0_0RCTTriggerReloadCommandListeners(@"Unknown from JS");
}

ABI49_0_0RCT_EXPORT_METHOD(debugRemotely : (BOOL)enableDebug)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  ((ABI49_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isDebuggingRemotely = enableDebug;
}

ABI49_0_0RCT_EXPORT_METHOD(setProfilingEnabled : (BOOL)enabled)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  ((ABI49_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isProfilingEnabled = enabled;
}

- (BOOL)profilingEnabled
{
  return ((ABI49_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isProfilingEnabled;
}

ABI49_0_0RCT_EXPORT_METHOD(setHotLoadingEnabled : (BOOL)enabled)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  ((ABI49_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isHotLoadingEnabled = enabled;
}

- (BOOL)hotLoadingEnabled
{
  return ((ABI49_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isHotLoadingEnabled;
}

- (void)setHotkeysEnabled:(BOOL)enabled
{
  if (enabled) {
    [self registerHotkeys];
  } else {
    [self unregisterHotkeys];
  }
}

- (BOOL)hotkeysEnabled
{
  return [self isHotkeysRegistered];
}

- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:
    (const ABI49_0_0facebook::ABI49_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI49_0_0facebook::ABI49_0_0React::NativeDevMenuSpecJSI>(params);
}

@end

#else // Unavailable when not in dev mode

@interface ABI49_0_0RCTDevMenu () <ABI49_0_0NativeDevMenuSpec>
@end

@implementation ABI49_0_0RCTDevMenu

- (void)show
{
}
- (void)reload
{
}
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler
{
}
- (void)addItem:(ABI49_0_0RCTDevMenu *)item
{
}

- (void)debugRemotely:(BOOL)enableDebug
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

- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:
    (const ABI49_0_0facebook::ABI49_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI49_0_0facebook::ABI49_0_0React::NativeDevMenuSpecJSI>(params);
}

@end

@implementation ABI49_0_0RCTDevMenuItem

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

@implementation ABI49_0_0RCTBridge (ABI49_0_0RCTDevMenu)

- (ABI49_0_0RCTDevMenu *)devMenu
{
#if ABI49_0_0RCT_DEV_MENU
  return [self moduleForClass:[ABI49_0_0RCTDevMenu class]];
#else
  return nil;
#endif
}

@end

Class ABI49_0_0RCTDevMenuCls(void)
{
  return ABI49_0_0RCTDevMenu.class;
}
