// Copyright 2018 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "GoogleUtilities/UserDefaults/Private/GULUserDefaults.h"

#import "GoogleUtilities/Logger/Private/GULLogger.h"

NS_ASSUME_NONNULL_BEGIN

static NSTimeInterval const kGULSynchronizeInterval = 1.0;

static NSString *const kGULLogFormat = @"I-GUL%06ld";

static GULLoggerService kGULLogUserDefaultsService = @"[GoogleUtilities/UserDefaults]";

typedef NS_ENUM(NSInteger, GULUDMessageCode) {
  GULUDMessageCodeInvalidKeyGet = 1,
  GULUDMessageCodeInvalidKeySet = 2,
  GULUDMessageCodeInvalidObjectSet = 3,
  GULUDMessageCodeSynchronizeFailed = 4,
};

@interface GULUserDefaults ()

/// Equivalent to the suite name for NSUserDefaults.
@property(readonly) CFStringRef appNameRef;

@property(atomic) BOOL isPreferenceFileExcluded;

@end

@implementation GULUserDefaults {
  // The application name is the same with the suite name of the NSUserDefaults, and it is used for
  // preferences.
  CFStringRef _appNameRef;
}

+ (GULUserDefaults *)standardUserDefaults {
  static GULUserDefaults *standardUserDefaults;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    standardUserDefaults = [[GULUserDefaults alloc] init];
  });
  return standardUserDefaults;
}

- (instancetype)init {
  return [self initWithSuiteName:nil];
}

- (instancetype)initWithSuiteName:(nullable NSString *)suiteName {
  self = [super init];

  NSString *name = [suiteName copy];

  if (self) {
    // `kCFPreferencesCurrentApplication` maps to the same defaults database as
    // `[NSUserDefaults standardUserDefaults]`.
    _appNameRef =
        name.length ? (__bridge_retained CFStringRef)name : kCFPreferencesCurrentApplication;
  }

  return self;
}

- (void)dealloc {
  // If we're using a custom `_appNameRef` it needs to be released. If it's a constant, it shouldn't
  // need to be released since we don't own it.
  if (CFStringCompare(_appNameRef, kCFPreferencesCurrentApplication, 0) != kCFCompareEqualTo) {
    CFRelease(_appNameRef);
  }

  [NSObject cancelPreviousPerformRequestsWithTarget:self
                                           selector:@selector(synchronize)
                                             object:nil];
}

- (nullable id)objectForKey:(NSString *)defaultName {
  NSString *key = [defaultName copy];
  if (![key isKindOfClass:[NSString class]] || !key.length) {
    GULLogWarning(@"<GoogleUtilities>", NO,
                  [NSString stringWithFormat:kGULLogFormat, (long)GULUDMessageCodeInvalidKeyGet],
                  @"Cannot get object for invalid user default key.");
    return nil;
  }
  return (__bridge_transfer id)CFPreferencesCopyAppValue((__bridge CFStringRef)key, _appNameRef);
}

- (void)setObject:(nullable id)value forKey:(NSString *)defaultName {
  NSString *key = [defaultName copy];
  if (![key isKindOfClass:[NSString class]] || !key.length) {
    GULLogWarning(kGULLogUserDefaultsService, NO,
                  [NSString stringWithFormat:kGULLogFormat, (long)GULUDMessageCodeInvalidKeySet],
                  @"Cannot set object for invalid user default key.");
    return;
  }
  if (!value) {
    CFPreferencesSetAppValue((__bridge CFStringRef)key, NULL, _appNameRef);
    [self scheduleSynchronize];
    return;
  }
  BOOL isAcceptableValue =
      [value isKindOfClass:[NSString class]] || [value isKindOfClass:[NSNumber class]] ||
      [value isKindOfClass:[NSArray class]] || [value isKindOfClass:[NSDictionary class]] ||
      [value isKindOfClass:[NSDate class]] || [value isKindOfClass:[NSData class]];
  if (!isAcceptableValue) {
    GULLogWarning(kGULLogUserDefaultsService, NO,
                  [NSString stringWithFormat:kGULLogFormat, (long)GULUDMessageCodeInvalidObjectSet],
                  @"Cannot set invalid object to user defaults. Must be a string, number, array, "
                  @"dictionary, date, or data. Value: %@",
                  value);
    return;
  }

  CFPreferencesSetAppValue((__bridge CFStringRef)key, (__bridge CFStringRef)value, _appNameRef);
  [self scheduleSynchronize];
}

- (void)removeObjectForKey:(NSString *)key {
  [self setObject:nil forKey:key];
}

#pragma mark - Getters

- (NSInteger)integerForKey:(NSString *)defaultName {
  NSNumber *object = [self objectForKey:defaultName];
  return object.integerValue;
}

- (float)floatForKey:(NSString *)defaultName {
  NSNumber *object = [self objectForKey:defaultName];
  return object.floatValue;
}

- (double)doubleForKey:(NSString *)defaultName {
  NSNumber *object = [self objectForKey:defaultName];
  return object.doubleValue;
}

- (BOOL)boolForKey:(NSString *)defaultName {
  NSNumber *object = [self objectForKey:defaultName];
  return object.boolValue;
}

- (nullable NSString *)stringForKey:(NSString *)defaultName {
  return [self objectForKey:defaultName];
}

- (nullable NSArray *)arrayForKey:(NSString *)defaultName {
  return [self objectForKey:defaultName];
}

- (nullable NSDictionary<NSString *, id> *)dictionaryForKey:(NSString *)defaultName {
  return [self objectForKey:defaultName];
}

#pragma mark - Setters

- (void)setInteger:(NSInteger)integer forKey:(NSString *)defaultName {
  [self setObject:@(integer) forKey:defaultName];
}

- (void)setFloat:(float)value forKey:(NSString *)defaultName {
  [self setObject:@(value) forKey:defaultName];
}

- (void)setDouble:(double)doubleNumber forKey:(NSString *)defaultName {
  [self setObject:@(doubleNumber) forKey:defaultName];
}

- (void)setBool:(BOOL)boolValue forKey:(NSString *)defaultName {
  [self setObject:@(boolValue) forKey:defaultName];
}

#pragma mark - Save data

- (void)synchronize {
  if (!CFPreferencesAppSynchronize(_appNameRef)) {
    GULLogError(kGULLogUserDefaultsService, NO,
                [NSString stringWithFormat:kGULLogFormat, (long)GULUDMessageCodeSynchronizeFailed],
                @"Cannot synchronize user defaults to disk");
  }
}

#pragma mark - Private methods

- (void)scheduleSynchronize {
  // Synchronize data using a timer so that multiple set... calls can be coalesced under one
  // synchronize.
  [NSObject cancelPreviousPerformRequestsWithTarget:self
                                           selector:@selector(synchronize)
                                             object:nil];
  // This method may be called on multiple queues (due to set... methods can be called on any queue)
  // synchronize can be scheduled on different queues, so make sure that it does not crash. If this
  // instance goes away, self will be released also, no one will retain it and the schedule won't be
  // called.
  [self performSelector:@selector(synchronize) withObject:nil afterDelay:kGULSynchronizeInterval];
}

@end

NS_ASSUME_NONNULL_END
