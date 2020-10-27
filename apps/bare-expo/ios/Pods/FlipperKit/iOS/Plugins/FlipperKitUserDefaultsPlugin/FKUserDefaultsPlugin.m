/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "FKUserDefaultsPlugin.h"
#import <FlipperKit/FlipperConnection.h>
#import <FlipperKit/FlipperResponder.h>
#import "FKUserDefaultsSwizzleUtility.h"

static NSString* const kStandardUserDefaultsName = @"Standard UserDefaults";
static NSString* const kAppSuiteUserDefaultsName = @"App Suite UserDefaults";

@interface FKUserDefaultsPlugin ()
@property(nonatomic, strong) id<FlipperConnection> flipperConnection;
@property(nonatomic, strong) NSUserDefaults* standardUserDefaults;
@property(nonatomic, strong) NSUserDefaults* appSuiteUserDefaults;
@property(nonatomic, copy) NSString* key;
@property(nonatomic, copy) NSString* suiteName;
@end

@implementation FKUserDefaultsPlugin

- (instancetype)init {
  if (self = [super init]) {
    _standardUserDefaults = [NSUserDefaults standardUserDefaults];
    __weak typeof(self) weakSelf = self;
    [FKUserDefaultsSwizzleUtility
        swizzleSelector:@selector(setObject:forKey:)
                  class:[NSUserDefaults class]
                  block:^(NSInvocation* _Nonnull invocation) {
                    __unsafe_unretained id firstArg = nil;
                    __unsafe_unretained id secondArg = nil;
                    [invocation getArgument:&firstArg atIndex:2];
                    [invocation getArgument:&secondArg atIndex:3];
                    [invocation invoke];
                    [weakSelf userDefaults:([invocation.target
                                                isKindOfClass:[NSUserDefaults
                                                                  class]]
                                                ? invocation.target
                                                : nil)
                          changedWithValue:firstArg
                                       key:secondArg];
                  }];
  }
  return self;
}

- (instancetype)initWithSuiteName:(NSString*)suiteName {
  if (self = [self init]) {
    _suiteName = suiteName;
    if (_suiteName) {
      _appSuiteUserDefaults =
          [[NSUserDefaults alloc] initWithSuiteName:_suiteName];
    }
  }
  return self;
}

- (void)didConnect:(id<FlipperConnection>)connection {
  self.flipperConnection = connection;
  [connection receive:@"getAllSharedPreferences"
            withBlock:^(NSDictionary* params, id<FlipperResponder> responder) {
              NSMutableDictionary* userDefaults = [NSMutableDictionary new];
              userDefaults[kStandardUserDefaultsName] =
                  [self.standardUserDefaults dictionaryRepresentation];
              if (self.appSuiteUserDefaults) {
                userDefaults[kAppSuiteUserDefaultsName] =
                    [self.appSuiteUserDefaults dictionaryRepresentation];
              }
              [responder success:userDefaults];
            }];

  [connection receive:@"setSharedPreference"
            withBlock:^(NSDictionary* params, id<FlipperResponder> responder) {
              NSUserDefaults* sharedPreferences =
                  [self sharedPreferencesForParams:params];
              NSString* preferenceName = params[@"preferenceName"];
              [sharedPreferences setObject:params[@"preferenceValue"]
                                    forKey:preferenceName];
              [responder success:[sharedPreferences dictionaryRepresentation]];
            }];

  [connection receive:@"deleteSharedPreference"
            withBlock:^(NSDictionary* params, id<FlipperResponder> responder) {
              NSUserDefaults* sharedPreferences =
                  [self sharedPreferencesForParams:params];
              NSString* preferenceName = params[@"preferenceName"];
              [sharedPreferences removeObjectForKey:preferenceName];
              [responder success:[sharedPreferences dictionaryRepresentation]];
            }];
}

- (void)didDisconnect {
  self.flipperConnection = nil;
}

- (NSString*)identifier {
  return @"Preferences";
}

#pragma mark - Private methods

- (NSUserDefaults*)sharedPreferencesForParams:(NSDictionary*)params {
  NSString* const sharedPreferencesNameKey = @"sharedPreferencesName";
  if (![params[sharedPreferencesNameKey] isKindOfClass:[NSString class]]) {
    return _standardUserDefaults;
  }

  NSString* sharedPreferencesName = params[sharedPreferencesNameKey];
  return (
      [sharedPreferencesName isEqualToString:kAppSuiteUserDefaultsName]
          ? _appSuiteUserDefaults
          : _standardUserDefaults);
}

- (void)userDefaults:(NSUserDefaults*)userDefaults
    changedWithValue:(id)value
                 key:(NSString*)key {
  NSTimeInterval interval = [[NSDate date] timeIntervalSince1970] * 1000;
  NSString* intervalStr = [NSString stringWithFormat:@"%f", interval];
  NSMutableDictionary* params =
      [@{@"name" : key, @"time" : intervalStr} mutableCopy];

  if (!value) {
    [params setObject:@"YES" forKey:@"deleted"];
  } else {
    [params setObject:value forKey:@"value"];
  }

  NSString* sharedPreferencesName =
      (userDefaults == _standardUserDefaults ? kStandardUserDefaultsName
                                             : kAppSuiteUserDefaultsName);
  [params setObject:sharedPreferencesName forKey:@"preferences"];
  [self.flipperConnection send:@"sharedPreferencesChange"
                    withParams:[params copy]];
}

@end
