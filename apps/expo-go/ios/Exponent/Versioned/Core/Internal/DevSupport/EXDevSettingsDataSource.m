// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevSettingsDataSource.h"

#import <React/RCTLog.h>
#import <React/RCTUtils.h>

// redefined from RCTDevMenu.mm
NSString *const EXDevSettingsUserDefaultsKey = @"RCTDevMenu";
NSString *const EXDevSettingShakeToShowDevMenu = @"shakeToShow";
NSString *const EXDevSettingProfilingEnabled = @"profilingEnabled";
NSString *const EXDevSettingHotLoadingEnabled = @"hotLoadingEnabled";
NSString *const EXDevSettingLiveReloadEnabled = @"liveReloadEnabled";
NSString *const EXDevSettingIsInspectorShown = @"showInspector";
NSString *const EXDevSettingIsDebuggingRemotely = @"isDebuggingRemotely";

@interface EXDevSettingsDataSource ()

@property (nonatomic, strong) NSString *scopeKey;
@property (nonatomic, readonly) NSSet *settingsDisabledInProduction;

@end

@implementation EXDevSettingsDataSource {
  NSMutableDictionary *_settings;
  NSUserDefaults *_userDefaults;
  BOOL _isDevelopment;
}

- (instancetype)initWithDefaultValues:(NSDictionary *)defaultValues
                forScopeKey:(NSString *)scopeKey
                        isDevelopment:(BOOL)isDevelopment
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
    _userDefaults = [NSUserDefaults standardUserDefaults];
    _isDevelopment = isDevelopment;
    _settingsDisabledInProduction = [NSSet setWithArray:@[
      EXDevSettingShakeToShowDevMenu,
      EXDevSettingProfilingEnabled,
      EXDevSettingHotLoadingEnabled,
      EXDevSettingLiveReloadEnabled,
      EXDevSettingIsInspectorShown,
      EXDevSettingIsDebuggingRemotely,
    ]];
    if (defaultValues) {
      [self _reloadWithDefaults:defaultValues];
    }
  }
  return self;
}

- (void)updateSettingWithValue:(id)value forKey:(NSString *)key
{
  RCTAssert((key != nil), @"%@", [NSString stringWithFormat:@"%@: Tried to update nil key", [self class]]);

  id currentValue = [self settingForKey:key];
  if (currentValue == value || [currentValue isEqual:value]) {
    return;
  }
  if (value) {
    _settings[key] = value;
  } else {
    [_settings removeObjectForKey:key];
  }
  [_userDefaults setObject:_settings forKey:[self _userDefaultsKey]];
}

- (id)settingForKey:(NSString *)key
{
  // live reload is always disabled in react-native@>=0.61 due to fast refresh
  // we can remove this when live reload is completely removed from the
  // react-native runtime
  if ([key isEqualToString:EXDevSettingLiveReloadEnabled]) {
    return @NO;
  }

  // prohibit these settings if not serving the experience as a developer
  if (!_isDevelopment && [_settingsDisabledInProduction containsObject:key]) {
    return @NO;
  }
  return _settings[key];
}

#pragma mark - internal

- (void)_reloadWithDefaults:(NSDictionary *)defaultValues
{
  NSString *defaultsKey = [self _userDefaultsKey];
  NSDictionary *existingSettings = [_userDefaults objectForKey:defaultsKey];
  _settings = existingSettings ? [existingSettings mutableCopy] : [NSMutableDictionary dictionary];
  for (NSString *key in [defaultValues keyEnumerator]) {
    if (!_settings[key]) {
      _settings[key] = defaultValues[key];
    }
  }
  [_userDefaults setObject:_settings forKey:defaultsKey];
}

- (NSString *)_userDefaultsKey
{
  if (_scopeKey) {
    return [NSString stringWithFormat:@"%@/%@", _scopeKey, EXDevSettingsUserDefaultsKey];
  } else {
    RCTLogWarn(@"Can't scope dev settings because bridge is not set");
    return EXDevSettingsUserDefaultsKey;
  }
}

@end
