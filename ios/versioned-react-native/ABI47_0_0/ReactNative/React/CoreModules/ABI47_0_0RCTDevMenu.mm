/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTDevMenu.h>

#import <ABI47_0_0FBReactNativeSpec/ABI47_0_0FBReactNativeSpec.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge+Private.h>
#import <ABI47_0_0React/ABI47_0_0RCTBundleURLProvider.h>
#import <ABI47_0_0React/ABI47_0_0RCTDefines.h>
#import <ABI47_0_0React/ABI47_0_0RCTDevSettings.h>
#import <ABI47_0_0React/ABI47_0_0RCTKeyCommands.h>
#import <ABI47_0_0React/ABI47_0_0RCTLog.h>
#import <ABI47_0_0React/ABI47_0_0RCTReloadCommand.h>
#import <ABI47_0_0React/ABI47_0_0RCTUtils.h>
#import "ABI47_0_0CoreModulesPlugins.h"

#if ABI47_0_0RCT_DEV_MENU
#if ABI47_0_0RCT_ENABLE_INSPECTOR
#import <ABI47_0_0React/ABI47_0_0RCTInspectorDevServerHelper.h>
#endif

NSString *const ABI47_0_0RCTShowDevMenuNotification = @"ABI47_0_0RCTShowDevMenuNotification";

@implementation UIWindow (ABI47_0_0RCTDevMenu)

- (void)ABI47_0_0RCT_motionEnded:(__unused UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI47_0_0RCTShowDevMenuNotification object:nil];
  }
}

@end

@implementation ABI47_0_0RCTDevMenuItem {
  ABI47_0_0RCTDevMenuItemTitleBlock _titleBlock;
  dispatch_block_t _handler;
}

- (instancetype)initWithTitleBlock:(ABI47_0_0RCTDevMenuItemTitleBlock)titleBlock handler:(dispatch_block_t)handler
{
  if ((self = [super init])) {
    _titleBlock = [titleBlock copy];
    _handler = [handler copy];
  }
  return self;
}

ABI47_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

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

typedef void (^ABI47_0_0RCTDevMenuAlertActionHandler)(UIAlertAction *action);

@interface ABI47_0_0RCTDevMenu () <ABI47_0_0RCTBridgeModule, ABI47_0_0RCTInvalidating, ABI47_0_0NativeDevMenuSpec>

@end

@implementation ABI47_0_0RCTDevMenu {
  UIAlertController *_actionSheet;
  NSMutableArray<ABI47_0_0RCTDevMenuItem *> *_extraMenuItems;
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;
@synthesize callableJSModules = _callableJSModules;
@synthesize bundleManager = _bundleManager;

+ (NSString *)moduleName { return @"ABI47_0_0RCTDevMenu"; }

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(showOnShake)
                                                 name:ABI47_0_0RCTShowDevMenuNotification
                                               object:nil];
    _extraMenuItems = [NSMutableArray new];

    [self registerHotkeys];
  }
  return self;
}

- (void)registerHotkeys
{
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  ABI47_0_0RCTKeyCommands *commands = [ABI47_0_0RCTKeyCommands sharedInstance];
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
                                   [(ABI47_0_0RCTDevSettings *)[weakSelf.moduleRegistry moduleForName:"DevSettings"]
                                       toggleElementInspector];
                                 }];

  // Reload in normal mode
  [commands registerKeyCommandWithInput:@"n"
                          modifierFlags:UIKeyModifierCommand
                                 action:^(__unused UIKeyCommand *command) {
                                   [(ABI47_0_0RCTDevSettings *)[weakSelf.moduleRegistry moduleForName:"DevSettings"]
                                       setIsDebuggingRemotely:NO];
                                 }];
#endif
}

- (void)unregisterHotkeys
{
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  ABI47_0_0RCTKeyCommands *commands = [ABI47_0_0RCTKeyCommands sharedInstance];

  [commands unregisterKeyCommandWithInput:@"d" modifierFlags:UIKeyModifierCommand];
  [commands unregisterKeyCommandWithInput:@"i" modifierFlags:UIKeyModifierCommand];
  [commands unregisterKeyCommandWithInput:@"n" modifierFlags:UIKeyModifierCommand];
#endif
}

- (BOOL)isHotkeysRegistered
{
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  ABI47_0_0RCTKeyCommands *commands = [ABI47_0_0RCTKeyCommands sharedInstance];

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
  if ([((ABI47_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]) isShakeToShowDevMenuEnabled]) {
    for (UIWindow *window in [ABI47_0_0RCTSharedApplication() windows]) {
      NSString *recursiveDescription = [window valueForKey:@"recursiveDescription"];
      if ([recursiveDescription containsString:@"ABI47_0_0RCTView"]) {
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
  [self addItem:[ABI47_0_0RCTDevMenuItem buttonItemWithTitle:title handler:handler]];
}

- (void)addItem:(ABI47_0_0RCTDevMenuItem *)item
{
  [_extraMenuItems addObject:item];
}

- (void)setDefaultJSBundle
{
  [[ABI47_0_0RCTBundleURLProvider sharedSettings] resetToDefaults];
  self->_bundleManager.bundleURL = [[ABI47_0_0RCTBundleURLProvider sharedSettings] jsBundleURLForFallbackExtension:nil];
  ABI47_0_0RCTTriggerReloadCommandListeners(@"Dev menu - reset to default");
}

- (NSArray<ABI47_0_0RCTDevMenuItem *> *)_menuItemsToPresent
{
  NSMutableArray<ABI47_0_0RCTDevMenuItem *> *items = [NSMutableArray new];

  // Add built-in items
  __weak ABI47_0_0RCTDevSettings *devSettings = [_moduleRegistry moduleForName:"DevSettings"];
  __weak ABI47_0_0RCTDevMenu *weakSelf = self;
  __weak ABI47_0_0RCTBundleManager *bundleManager = _bundleManager;

  [items addObject:[ABI47_0_0RCTDevMenuItem buttonItemWithTitle:@"Reload"
                                               handler:^{
                                                 ABI47_0_0RCTTriggerReloadCommandListeners(@"Dev menu - reload");
                                               }]];

  if (!devSettings.isProfilingEnabled) {
#if ABI47_0_0RCT_ENABLE_INSPECTOR
    if (devSettings.isDeviceDebuggingAvailable) {
      // For on-device debugging we link out to Flipper.
      // Since we're assuming Flipper is available, also include the DevTools.
      // Note: For parity with the Android code.
      [items addObject:[ABI47_0_0RCTDevMenuItem
                           buttonItemWithTitleBlock:^NSString * {
                             return @"Open Debugger";
                           }
                           handler:^{
                             [ABI47_0_0RCTInspectorDevServerHelper
                                          openURL:@"flipper://null/Hermesdebuggerrn?device=ABI47_0_0React%20Native"
                                    withBundleURL:bundleManager.bundleURL
                                 withErrorMessage:@"Failed to open Flipper. Please check that Metro is runnning."];
                           }]];

      [items addObject:[ABI47_0_0RCTDevMenuItem
                           buttonItemWithTitleBlock:^NSString * {
                             return @"Open ABI47_0_0React DevTools";
                           }
                           handler:^{
                             [ABI47_0_0RCTInspectorDevServerHelper
                                          openURL:@"flipper://null/ABI47_0_0React?device=ABI47_0_0React%20Native"
                                    withBundleURL:bundleManager.bundleURL
                                 withErrorMessage:@"Failed to open Flipper. Please check that Metro is runnning."];
                           }]];
    } else if (devSettings.isRemoteDebuggingAvailable) {
#else
    if (devSettings.isRemoteDebuggingAvailable) {
#endif
      // For remote debugging, we open up Chrome running the app in a web worker.
      // Note that this requires async communication, which will not work for Turbo Modules.
      [items addObject:[ABI47_0_0RCTDevMenuItem
                           buttonItemWithTitleBlock:^NSString * {
                             return devSettings.isDebuggingRemotely ? @"Stop Debugging" : @"Debug with Chrome";
                           }
                           handler:^{
                             devSettings.isDebuggingRemotely = !devSettings.isDebuggingRemotely;
                           }]];
    } else {
      // If neither are available, we're defaulting to a message that tells you about remote debugging.
      [items
          addObject:[ABI47_0_0RCTDevMenuItem
                        buttonItemWithTitle:@"Debugger Unavailable"
                                    handler:^{
                                      NSString *message = ABI47_0_0RCTTurboModuleEnabled()
                                          ? @"Debugging with Chrome is not supported when TurboModules are enabled."
                                          : @"Include the ABI47_0_0RCTWebSocket library to enable JavaScript debugging.";
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
                                      [ABI47_0_0RCTPresentedViewController() presentViewController:alertController
                                                                                 animated:YES
                                                                               completion:NULL];
                                    }]];
    }
  }

  [items addObject:[ABI47_0_0RCTDevMenuItem
                       buttonItemWithTitleBlock:^NSString * {
                         return devSettings.isElementInspectorShown ? @"Hide Inspector" : @"Show Inspector";
                       }
                       handler:^{
                         [devSettings toggleElementInspector];
                       }]];

  if (devSettings.isHotLoadingAvailable) {
    [items addObject:[ABI47_0_0RCTDevMenuItem
                         buttonItemWithTitleBlock:^NSString * {
                           // Previously known as "Hot Reloading". We won't use this term anymore.
                           return devSettings.isHotLoadingEnabled ? @"Disable Fast Refresh" : @"Enable Fast Refresh";
                         }
                         handler:^{
                           devSettings.isHotLoadingEnabled = !devSettings.isHotLoadingEnabled;
                         }]];
  }

  [items
      addObject:[ABI47_0_0RCTDevMenuItem
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
                                                    portNumber = [NSNumber numberWithInt:ABI47_0_0RCT_METRO_PORT];
                                                  }
                                                  [ABI47_0_0RCTBundleURLProvider sharedSettings].jsLocation = [NSString
                                                      stringWithFormat:@"%@:%d", ipTextField.text, portNumber.intValue];
                                                  if (bundleRoot.length == 0) {
                                                    [bundleManager resetBundleURL];
                                                  } else {
                                                    bundleManager.bundleURL = [[ABI47_0_0RCTBundleURLProvider sharedSettings]
                                                        jsBundleURLForBundleRoot:bundleRoot];
                                                  }

                                                  ABI47_0_0RCTTriggerReloadCommandListeners(@"Dev menu - apply changes");
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
                      [ABI47_0_0RCTPresentedViewController() presentViewController:alertController animated:YES completion:NULL];
                    }]];

  [items addObjectsFromArray:_extraMenuItems];
  return items;
}

ABI47_0_0RCT_EXPORT_METHOD(show)
{
  if (_actionSheet || ABI47_0_0RCTRunningInAppExtension()) {
    return;
  }

  NSString *bridgeDescription = _bridge.bridgeDescription;
  NSString *description =
      bridgeDescription.length > 0 ? [NSString stringWithFormat:@"Running %@", bridgeDescription] : nil;

  // On larger devices we don't have an anchor point for the action sheet
  UIAlertControllerStyle style = [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone
      ? UIAlertControllerStyleActionSheet
      : UIAlertControllerStyleAlert;

  NSString *debugMenuType = self.bridge ? @"Bridge" : @"Bridgeless";
  NSString *debugMenuTitle = [NSString stringWithFormat:@"ABI47_0_0React Native Debug Menu (%@)", debugMenuType];

  _actionSheet = [UIAlertController alertControllerWithTitle:debugMenuTitle message:description preferredStyle:style];

  NSArray<ABI47_0_0RCTDevMenuItem *> *items = [self _menuItemsToPresent];
  for (ABI47_0_0RCTDevMenuItem *item in items) {
    [_actionSheet addAction:[UIAlertAction actionWithTitle:item.title
                                                     style:UIAlertActionStyleDefault
                                                   handler:[self alertActionHandlerForDevItem:item]]];
  }

  [_actionSheet addAction:[UIAlertAction actionWithTitle:@"Cancel"
                                                   style:UIAlertActionStyleCancel
                                                 handler:[self alertActionHandlerForDevItem:nil]]];

  _presentedItems = items;
  [ABI47_0_0RCTPresentedViewController() presentViewController:_actionSheet animated:YES completion:nil];

  [_callableJSModules invokeModule:@"ABI47_0_0RCTNativeAppEventEmitter" method:@"emit" withArgs:@[ @"ABI47_0_0RCTDevMenuShown" ]];
}

- (ABI47_0_0RCTDevMenuAlertActionHandler)alertActionHandlerForDevItem:(ABI47_0_0RCTDevMenuItem *__nullable)item
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
  ABI47_0_0RCTLogWarn(@"Using deprecated method %s, use ABI47_0_0RCTDevSettings instead", __func__)

- (void)setShakeToShow:(BOOL)shakeToShow
{
  ((ABI47_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isShakeToShowDevMenuEnabled = shakeToShow;
}

- (BOOL)shakeToShow
{
  return ((ABI47_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isShakeToShowDevMenuEnabled;
}

ABI47_0_0RCT_EXPORT_METHOD(reload)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  ABI47_0_0RCTTriggerReloadCommandListeners(@"Unknown from JS");
}

ABI47_0_0RCT_EXPORT_METHOD(debugRemotely : (BOOL)enableDebug)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  ((ABI47_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isDebuggingRemotely = enableDebug;
}

ABI47_0_0RCT_EXPORT_METHOD(setProfilingEnabled : (BOOL)enabled)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  ((ABI47_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isProfilingEnabled = enabled;
}

- (BOOL)profilingEnabled
{
  return ((ABI47_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isProfilingEnabled;
}

ABI47_0_0RCT_EXPORT_METHOD(setHotLoadingEnabled : (BOOL)enabled)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  ((ABI47_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isHotLoadingEnabled = enabled;
}

- (BOOL)hotLoadingEnabled
{
  return ((ABI47_0_0RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isHotLoadingEnabled;
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

- (std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::TurboModule>)getTurboModule:
    (const ABI47_0_0facebook::ABI47_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI47_0_0facebook::ABI47_0_0React::NativeDevMenuSpecJSI>(params);
}

@end

#else // Unavailable when not in dev mode

@interface ABI47_0_0RCTDevMenu () <ABI47_0_0NativeDevMenuSpec>
@end

@implementation ABI47_0_0RCTDevMenu

- (void)show
{
}
- (void)reload
{
}
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler
{
}
- (void)addItem:(ABI47_0_0RCTDevMenu *)item
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

- (std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::TurboModule>)getTurboModule:
    (const ABI47_0_0facebook::ABI47_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI47_0_0facebook::ABI47_0_0React::NativeDevMenuSpecJSI>(params);
}

@end

@implementation ABI47_0_0RCTDevMenuItem

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

@implementation ABI47_0_0RCTBridge (ABI47_0_0RCTDevMenu)

- (ABI47_0_0RCTDevMenu *)devMenu
{
#if ABI47_0_0RCT_DEV_MENU
  return [self moduleForClass:[ABI47_0_0RCTDevMenu class]];
#else
  return nil;
#endif
}

@end

Class ABI47_0_0RCTDevMenuCls(void)
{
  return ABI47_0_0RCTDevMenu.class;
}
