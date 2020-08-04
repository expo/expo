/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTDevMenu.h>

#import <ABI37_0_0React/ABI37_0_0RCTBridge+Private.h>
#import <ABI37_0_0React/ABI37_0_0RCTDevSettings.h>
#import <ABI37_0_0React/ABI37_0_0RCTKeyCommands.h>
#import <ABI37_0_0React/ABI37_0_0RCTLog.h>
#import <ABI37_0_0React/ABI37_0_0RCTUtils.h>
#import <ABI37_0_0React/ABI37_0_0RCTDefines.h>
#import <ABI37_0_0React/ABI37_0_0RCTBundleURLProvider.h>

#if ABI37_0_0RCT_DEV

#if ABI37_0_0RCT_ENABLE_INSPECTOR
#import <ABI37_0_0React/ABI37_0_0RCTInspectorDevServerHelper.h>
#endif

NSString *const ABI37_0_0RCTShowDevMenuNotification = @"ABI37_0_0RCTShowDevMenuNotification";

@implementation UIWindow (ABI37_0_0RCTDevMenu)

- (void)ABI37_0_0RCT_motionEnded:(__unused UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI37_0_0RCTShowDevMenuNotification object:nil];
  }
}

@end

@implementation ABI37_0_0RCTDevMenuItem
{
  ABI37_0_0RCTDevMenuItemTitleBlock _titleBlock;
  dispatch_block_t _handler;
}

- (instancetype)initWithTitleBlock:(ABI37_0_0RCTDevMenuItemTitleBlock)titleBlock
                           handler:(dispatch_block_t)handler
{
  if ((self = [super init])) {
    _titleBlock = [titleBlock copy];
    _handler = [handler copy];
  }
  return self;
}

ABI37_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

+ (instancetype)buttonItemWithTitleBlock:(NSString *(^)(void))titleBlock handler:(dispatch_block_t)handler
{
  return [[self alloc] initWithTitleBlock:titleBlock handler:handler];
}

+ (instancetype)buttonItemWithTitle:(NSString *)title
                            handler:(dispatch_block_t)handler
{
  return [[self alloc] initWithTitleBlock:^NSString *{ return title; } handler:handler];
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

typedef void(^ABI37_0_0RCTDevMenuAlertActionHandler)(UIAlertAction *action);

@interface ABI37_0_0RCTDevMenu () <ABI37_0_0RCTBridgeModule, ABI37_0_0RCTInvalidating>

@end

@implementation ABI37_0_0RCTDevMenu
{
  UIAlertController *_actionSheet;
  NSMutableArray<ABI37_0_0RCTDevMenuItem *> *_extraMenuItems;
}

@synthesize bridge = _bridge;

+ (NSString *)moduleName { return @"ABI37_0_0RCTDevMenu"; }

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(showOnShake)
                                                 name:ABI37_0_0RCTShowDevMenuNotification
                                               object:nil];
    _extraMenuItems = [NSMutableArray new];

#if TARGET_OS_SIMULATOR
    ABI37_0_0RCTKeyCommands *commands = [ABI37_0_0RCTKeyCommands sharedInstance];
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
  [_actionSheet dismissViewControllerAnimated:YES completion:^(void){}];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
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
    [_actionSheet dismissViewControllerAnimated:YES completion:^(void){}];
    _actionSheet = nil;
  } else {
    [self show];
  }
}

- (BOOL)isActionSheetShown
{
  return _actionSheet != nil;
}

- (void)addItem:(NSString *)title handler:(void(^)(void))handler
{
  [self addItem:[ABI37_0_0RCTDevMenuItem buttonItemWithTitle:title handler:handler]];
}

- (void)addItem:(ABI37_0_0RCTDevMenuItem *)item
{
  [_extraMenuItems addObject:item];
}

- (void)setDefaultJSBundle {
  [[ABI37_0_0RCTBundleURLProvider sharedSettings] resetToDefaults];
  self->_bridge.bundleURL = [[ABI37_0_0RCTBundleURLProvider sharedSettings] jsBundleURLForFallbackResource:nil fallbackExtension:nil];
  [self->_bridge reload];
}

- (NSArray<ABI37_0_0RCTDevMenuItem *> *)_menuItemsToPresent
{
  NSMutableArray<ABI37_0_0RCTDevMenuItem *> *items = [NSMutableArray new];

  // Add built-in items
  __weak ABI37_0_0RCTBridge *bridge = _bridge;
  __weak ABI37_0_0RCTDevSettings *devSettings = _bridge.devSettings;
  __weak ABI37_0_0RCTDevMenu *weakSelf = self;

  [items addObject:[ABI37_0_0RCTDevMenuItem buttonItemWithTitle:@"Reload" handler:^{
    [bridge reload];
  }]];

  if (!devSettings.isProfilingEnabled) {
    if (!devSettings.isRemoteDebuggingAvailable) {
      [items addObject:[ABI37_0_0RCTDevMenuItem buttonItemWithTitle:@"Debugger Unavailable" handler:^{
        NSString *message = ABI37_0_0RCTTurboModuleEnabled() ?
            @"Debugging is not currently supported when TurboModule is enabled." :
            @"Include the ABI37_0_0RCTWebSocket library to enable JavaScript debugging.";
        UIAlertController *alertController = [UIAlertController
          alertControllerWithTitle:@"Debugger Unavailable"
          message:message
          preferredStyle:UIAlertControllerStyleAlert];
        __weak typeof(alertController) weakAlertController = alertController;
        [alertController addAction:
        [UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *action){
          [weakAlertController dismissViewControllerAnimated:YES completion:nil];
        }]];
        [ABI37_0_0RCTPresentedViewController() presentViewController:alertController animated:YES completion:NULL];
      }]];
    } else {
      [items addObject:[ABI37_0_0RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
        if (devSettings.isNuclideDebuggingAvailable) {
          return devSettings.isDebuggingRemotely ? @"Stop Chrome Debugger" : @"Debug with Chrome";
        } else {
          return devSettings.isDebuggingRemotely ? @"Stop Debugging" : @"Debug";
        }
      } handler:^{
        devSettings.isDebuggingRemotely = !devSettings.isDebuggingRemotely;
      }]];
    }

    if (devSettings.isNuclideDebuggingAvailable && !devSettings.isDebuggingRemotely) {
      [items addObject:[ABI37_0_0RCTDevMenuItem buttonItemWithTitle:@"Debug with Nuclide" handler:^{
  #if ABI37_0_0RCT_ENABLE_INSPECTOR && !TARGET_OS_UIKITFORMAC
        [ABI37_0_0RCTInspectorDevServerHelper attachDebugger:@"ABI37_0_0ReactNative" withBundleURL:bridge.bundleURL withView: ABI37_0_0RCTPresentedViewController()];
  #endif
      }]];
    }
  }

  [items addObject:[ABI37_0_0RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
    return devSettings.isElementInspectorShown ? @"Hide Inspector" : @"Show Inspector";
  } handler:^{
    [devSettings toggleElementInspector];
  }]];

  if (devSettings.isHotLoadingAvailable) {
    [items addObject:[ABI37_0_0RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      // Previously known as "Hot Reloading". We won't use this term anymore.
      return devSettings.isHotLoadingEnabled ? @"Disable Fast Refresh" : @"Enable Fast Refresh";
    } handler:^{
      devSettings.isHotLoadingEnabled = !devSettings.isHotLoadingEnabled;
    }]];
  }

  if (devSettings.isLiveReloadAvailable) {
    [items addObject:[ABI37_0_0RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      return devSettings.isDebuggingRemotely
        ? @"Systrace Unavailable"
        : devSettings.isProfilingEnabled
          ? @"Stop Systrace"
          : @"Start Systrace";
    } handler:^{
      if (devSettings.isDebuggingRemotely) {
        UIAlertController *alertController = [UIAlertController
          alertControllerWithTitle:@"Systrace Unavailable"
          message:@"Stop debugging to enable Systrace."
          preferredStyle:UIAlertControllerStyleAlert];
        __weak typeof(alertController) weakAlertController = alertController;
        [alertController addAction:
         [UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *action){
          [weakAlertController dismissViewControllerAnimated:YES completion:nil];
        }]];
        [ABI37_0_0RCTPresentedViewController() presentViewController:alertController animated:YES completion:NULL];
      } else {
        devSettings.isProfilingEnabled = !devSettings.isProfilingEnabled;
      }
    }]];
    // "Live reload" which refreshes on every edit was removed in favor of "Fast Refresh".
    // While native code for "Live reload" is still there, please don't add the option back.
    // See D15958697 for more context.
  }

  [items addObject:[ABI37_0_0RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
    return @"Configure Bundler";
  } handler:^{
    UIAlertController * alertController = [UIAlertController alertControllerWithTitle: @"Configure Bundler"
                                                                              message: @"Provide a custom bundler address, port, and entrypoint."
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
    [alertController addAction:[UIAlertAction actionWithTitle:@"Apply Changes" style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *action) {
      NSArray * textfields = alertController.textFields;
      UITextField * ipTextField = textfields[0];
      UITextField * portTextField = textfields[1];
      UITextField * bundleRootTextField = textfields[2];
      NSString * bundleRoot = bundleRootTextField.text;
      if(ipTextField.text.length == 0 && portTextField.text.length == 0) {
        [weakSelf setDefaultJSBundle];
        return;
      }
      NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
      formatter.numberStyle = NSNumberFormatterDecimalStyle;
      NSNumber *portNumber = [formatter numberFromString:portTextField.text];
      if (portNumber == nil) {
        portNumber = [NSNumber numberWithInt: ABI37_0_0RCT_METRO_PORT];
      }
      [ABI37_0_0RCTBundleURLProvider sharedSettings].jsLocation = [NSString stringWithFormat:@"%@:%d",
                                                          ipTextField.text, portNumber.intValue];
      __strong ABI37_0_0RCTBridge *strongBridge = bridge;
      if (strongBridge) {
        NSURL *bundleURL = bundleRoot.length
          ? [[ABI37_0_0RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:bundleRoot fallbackResource:nil]
          : [strongBridge.delegate sourceURLForBridge:strongBridge];
        strongBridge.bundleURL = bundleURL;
        [strongBridge reload];
      }
    }]];
    [alertController addAction:[UIAlertAction actionWithTitle:@"Reset to Default" style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *action) {
      [weakSelf setDefaultJSBundle];
    }]];
    [alertController addAction:[UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:^(__unused UIAlertAction *action) {
      return;
    }]];
    [ABI37_0_0RCTPresentedViewController() presentViewController:alertController animated:YES completion:NULL];
  }]];

  [items addObjectsFromArray:_extraMenuItems];
  return items;
}

ABI37_0_0RCT_EXPORT_METHOD(show)
{
  if (_actionSheet || !_bridge || ABI37_0_0RCTRunningInAppExtension()) {
    return;
  }

  NSString *bridgeDescription = _bridge.bridgeDescription;
  NSString *description = bridgeDescription.length > 0
    ? [NSString stringWithFormat:@"Running %@", bridgeDescription]
    : nil;

  // On larger devices we don't have an anchor point for the action sheet
  UIAlertControllerStyle style = [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone ? UIAlertControllerStyleActionSheet : UIAlertControllerStyleAlert;
  _actionSheet = [UIAlertController alertControllerWithTitle:@"ABI37_0_0React Native Debug Menu"
                                                     message:description
                                              preferredStyle:style];

  NSArray<ABI37_0_0RCTDevMenuItem *> *items = [self _menuItemsToPresent];
  for (ABI37_0_0RCTDevMenuItem *item in items) {
    [_actionSheet addAction:[UIAlertAction actionWithTitle:item.title
                                                     style:UIAlertActionStyleDefault
                                                   handler:[self alertActionHandlerForDevItem:item]]];
  }

  [_actionSheet addAction:[UIAlertAction actionWithTitle:@"Cancel"
                                                   style:UIAlertActionStyleCancel
                                                 handler:[self alertActionHandlerForDevItem:nil]]];

  _presentedItems = items;
  [ABI37_0_0RCTPresentedViewController() presentViewController:_actionSheet animated:YES completion:nil];
}

- (ABI37_0_0RCTDevMenuAlertActionHandler)alertActionHandlerForDevItem:(ABI37_0_0RCTDevMenuItem *__nullable)item
{
  return ^(__unused UIAlertAction *action) {
    if (item) {
      [item callHandler];
    }

    self->_actionSheet = nil;
  };
}

#pragma mark - deprecated methods and properties

#define WARN_DEPRECATED_DEV_MENU_EXPORT() ABI37_0_0RCTLogWarn(@"Using deprecated method %s, use ABI37_0_0RCTDevSettings instead", __func__)

- (void)setShakeToShow:(BOOL)shakeToShow
{
  _bridge.devSettings.isShakeToShowDevMenuEnabled = shakeToShow;
}

- (BOOL)shakeToShow
{
  return _bridge.devSettings.isShakeToShowDevMenuEnabled;
}

ABI37_0_0RCT_EXPORT_METHOD(reload)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  [_bridge reload];
}

ABI37_0_0RCT_EXPORT_METHOD(debugRemotely:(BOOL)enableDebug)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  _bridge.devSettings.isDebuggingRemotely = enableDebug;
}

ABI37_0_0RCT_EXPORT_METHOD(setProfilingEnabled:(BOOL)enabled)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  _bridge.devSettings.isProfilingEnabled = enabled;
}

- (BOOL)profilingEnabled
{
  return _bridge.devSettings.isProfilingEnabled;
}

ABI37_0_0RCT_EXPORT_METHOD(setLiveReloadEnabled:(BOOL)enabled)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  _bridge.devSettings.isLiveReloadEnabled = enabled;
}

- (BOOL)liveReloadEnabled
{
  return _bridge.devSettings.isLiveReloadEnabled;
}

ABI37_0_0RCT_EXPORT_METHOD(setHotLoadingEnabled:(BOOL)enabled)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  _bridge.devSettings.isHotLoadingEnabled = enabled;
}

- (BOOL)hotLoadingEnabled
{
  return _bridge.devSettings.isHotLoadingEnabled;
}

@end

#else // Unavailable when not in dev mode

@implementation ABI37_0_0RCTDevMenu

- (void)show {}
- (void)reload {}
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler {}
- (void)addItem:(ABI37_0_0RCTDevMenu *)item {}
- (BOOL)isActionSheetShown { return NO; }
+ (NSString *)moduleName { return @""; }

@end

@implementation ABI37_0_0RCTDevMenuItem

+ (instancetype)buttonItemWithTitle:(NSString *)title handler:(void(^)(void))handler {return nil;}
+ (instancetype)buttonItemWithTitleBlock:(NSString * (^)(void))titleBlock
                                 handler:(void(^)(void))handler {return nil;}

@end

#endif

@implementation  ABI37_0_0RCTBridge (ABI37_0_0RCTDevMenu)

- (ABI37_0_0RCTDevMenu *)devMenu
{
#if ABI37_0_0RCT_DEV
  return [self moduleForClass:[ABI37_0_0RCTDevMenu class]];
#else
  return nil;
#endif
}

@end
