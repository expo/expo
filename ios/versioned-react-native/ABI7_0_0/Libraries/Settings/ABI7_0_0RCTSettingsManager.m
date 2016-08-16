/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTSettingsManager.h"

#import "ABI7_0_0RCTBridge.h"
#import "ABI7_0_0RCTConvert.h"
#import "ABI7_0_0RCTEventDispatcher.h"
#import "ABI7_0_0RCTUtils.h"

@implementation ABI7_0_0RCTSettingsManager
{
  BOOL _ignoringUpdates;
  NSUserDefaults *_defaults;
}

@synthesize bridge = _bridge;

ABI7_0_0RCT_EXPORT_MODULE()

- (instancetype)initWithUserDefaults:(NSUserDefaults *)defaults
{
  if ((self = [self init])) {
    _defaults = defaults;
  }
  return self;
}

- (void)setBridge:(ABI7_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  if (!_defaults) {
    _defaults = [NSUserDefaults standardUserDefaults];
  }

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(userDefaultsDidChange:)
                                               name:NSUserDefaultsDidChangeNotification
                                             object:_defaults];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return @{@"settings": ABI7_0_0RCTJSONClean([_defaults dictionaryRepresentation])};
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)userDefaultsDidChange:(NSNotification *)note
{
  if (_ignoringUpdates) {
    return;
  }

  [_bridge.eventDispatcher
   sendDeviceEventWithName:@"settingsUpdated"
   body:ABI7_0_0RCTJSONClean([_defaults dictionaryRepresentation])];
}

/**
 * Set one or more values in the settings.
 * TODO: would it be useful to have a callback for when this has completed?
 */
ABI7_0_0RCT_EXPORT_METHOD(setValues:(NSDictionary *)values)
{
  _ignoringUpdates = YES;
  [values enumerateKeysAndObjectsUsingBlock:^(NSString *key, id json, BOOL *stop) {
    id plist = [ABI7_0_0RCTConvert NSPropertyList:json];
    if (plist) {
      [_defaults setObject:plist forKey:key];
    } else {
      [_defaults removeObjectForKey:key];
    }
  }];

  [_defaults synchronize];
  _ignoringUpdates = NO;
}

/**
 * Remove some values from the settings.
 */
ABI7_0_0RCT_EXPORT_METHOD(deleteValues:(NSArray<NSString *> *)keys)
{
  _ignoringUpdates = YES;
  for (NSString *key in keys) {
    [_defaults removeObjectForKey:key];
  }

  [_defaults synchronize];
  _ignoringUpdates = NO;
}

@end
