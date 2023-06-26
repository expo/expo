/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTSettingsManager.h>

#import <ABI49_0_0FBReactNativeSpec/ABI49_0_0FBReactNativeSpec.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcherProtocol.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>

#import "ABI49_0_0RCTSettingsPlugins.h"

@interface ABI49_0_0RCTSettingsManager () <ABI49_0_0NativeSettingsManagerSpec>
@end

@implementation ABI49_0_0RCTSettingsManager {
  BOOL _ignoringUpdates;
  NSUserDefaults *_defaults;
}

@synthesize moduleRegistry = _moduleRegistry;

ABI49_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  return [self initWithUserDefaults:[NSUserDefaults standardUserDefaults]];
}

- (instancetype)initWithUserDefaults:(NSUserDefaults *)defaults
{
  if ((self = [super init])) {
    _defaults = defaults;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(userDefaultsDidChange:)
                                                 name:NSUserDefaultsDidChangeNotification
                                               object:_defaults];
  }
  return self;
}

- (ABI49_0_0facebook::ABI49_0_0React::ModuleConstants<ABI49_0_0JS::NativeSettingsManager::Constants>)constantsToExport
{
  return (ABI49_0_0facebook::ABI49_0_0React::ModuleConstants<ABI49_0_0JS::NativeSettingsManager::Constants>)[self getConstants];
}

- (ABI49_0_0facebook::ABI49_0_0React::ModuleConstants<ABI49_0_0JS::NativeSettingsManager::Constants>)getConstants
{
  return ABI49_0_0facebook::ABI49_0_0React::typedConstants<ABI49_0_0JS::NativeSettingsManager::Constants>(
      {.settings = ABI49_0_0RCTJSONClean([_defaults dictionaryRepresentation])});
}

- (void)userDefaultsDidChange:(NSNotification *)note
{
  if (_ignoringUpdates) {
    return;
  }

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [[_moduleRegistry moduleForName:"EventDispatcher"]
      sendDeviceEventWithName:@"settingsUpdated"
                         body:ABI49_0_0RCTJSONClean([_defaults dictionaryRepresentation])];
#pragma clang diagnostic pop
}

/**
 * Set one or more values in the settings.
 * TODO: would it be useful to have a callback for when this has completed?
 */
ABI49_0_0RCT_EXPORT_METHOD(setValues : (NSDictionary *)values)
{
  _ignoringUpdates = YES;
  [values enumerateKeysAndObjectsUsingBlock:^(NSString *key, id json, BOOL *stop) {
    id plist = [ABI49_0_0RCTConvert NSPropertyList:json];
    if (plist) {
      [self->_defaults setObject:plist forKey:key];
    } else {
      [self->_defaults removeObjectForKey:key];
    }
  }];

  [_defaults synchronize];
  _ignoringUpdates = NO;
}

/**
 * Remove some values from the settings.
 */
ABI49_0_0RCT_EXPORT_METHOD(deleteValues : (NSArray<NSString *> *)keys)
{
  _ignoringUpdates = YES;
  for (NSString *key in keys) {
    [_defaults removeObjectForKey:key];
  }

  [_defaults synchronize];
  _ignoringUpdates = NO;
}

- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:
    (const ABI49_0_0facebook::ABI49_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI49_0_0facebook::ABI49_0_0React::NativeSettingsManagerSpecJSI>(params);
}

@end

Class ABI49_0_0RCTSettingsManagerCls(void)
{
  return ABI49_0_0RCTSettingsManager.class;
}
