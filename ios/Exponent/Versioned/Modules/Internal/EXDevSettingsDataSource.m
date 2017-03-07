// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevSettingsDataSource.h"
#import "EXScope.h"

#import <React/RCTLog.h>
#import <React/RCTUtils.h>

// redefined from RCTDevMenu.mm
NSString *const kRCTDevSettingsUserDefaultsKey = @"RCTDevMenu";

@interface EXDevSettingsDataSource ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation EXDevSettingsDataSource {
  NSMutableDictionary *_settings;
  NSUserDefaults *_userDefaults;
}

- (instancetype)initWithDefaultValues:(NSDictionary *)defaultValues forExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _userDefaults = [NSUserDefaults standardUserDefaults];
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
  if (_experienceId) {
    return [NSString stringWithFormat:@"%@/%@", _experienceId, kRCTDevSettingsUserDefaultsKey];
  } else {
    RCTLogWarn(@"Can't scope dev settings because bridge is not set");
    return kRCTDevSettingsUserDefaultsKey;
  }
}

@end
