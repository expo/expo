/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTSettingsManager.h>

#import <ABI42_0_0FBReactNativeSpec/ABI42_0_0FBReactNativeSpec.h>
#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>
#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>

#import "ABI42_0_0RCTSettingsPlugins.h"

@interface ABI42_0_0RCTSettingsManager() <ABI42_0_0NativeSettingsManagerSpec>
@end

@implementation ABI42_0_0RCTSettingsManager
{
  BOOL _ignoringUpdates;
  NSUserDefaults *_defaults;
}

@synthesize bridge = _bridge;

ABI42_0_0RCT_EXPORT_MODULE()

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

- (ABI42_0_0facebook::ABI42_0_0React::ModuleConstants<JS::NativeSettingsManager::Constants>)constantsToExport
{
  return (ABI42_0_0facebook::ABI42_0_0React::ModuleConstants<JS::NativeSettingsManager::Constants>)[self getConstants];
}

- (ABI42_0_0facebook::ABI42_0_0React::ModuleConstants<JS::NativeSettingsManager::Constants>)getConstants
{
  return ABI42_0_0facebook::ABI42_0_0React::typedConstants<JS::NativeSettingsManager::Constants>({
    .settings = ABI42_0_0RCTJSONClean([_defaults dictionaryRepresentation])
  });
}

- (void)userDefaultsDidChange:(NSNotification *)note
{
  if (_ignoringUpdates) {
    return;
  }

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher
   sendDeviceEventWithName:@"settingsUpdated"
   body:ABI42_0_0RCTJSONClean([_defaults dictionaryRepresentation])];
#pragma clang diagnostic pop
}

/**
 * Set one or more values in the settings.
 * TODO: would it be useful to have a callback for when this has completed?
 */
ABI42_0_0RCT_EXPORT_METHOD(setValues:(NSDictionary *)values)
{
  _ignoringUpdates = YES;
  [values enumerateKeysAndObjectsUsingBlock:^(NSString *key, id json, BOOL *stop) {
    id plist = [ABI42_0_0RCTConvert NSPropertyList:json];
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
ABI42_0_0RCT_EXPORT_METHOD(deleteValues:(NSArray<NSString *> *)keys)
{
  _ignoringUpdates = YES;
  for (NSString *key in keys) {
    [_defaults removeObjectForKey:key];
  }

  [_defaults synchronize];
  _ignoringUpdates = NO;
}

- (std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<ABI42_0_0facebook::ABI42_0_0React::CallInvoker>)nativeInvoker
                     perfLogger:(id<ABI42_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<ABI42_0_0facebook::ABI42_0_0React::NativeSettingsManagerSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

Class ABI42_0_0RCTSettingsManagerCls(void)
{
  return ABI42_0_0RCTSettingsManager.class;
}
