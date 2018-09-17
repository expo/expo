

#import <EXFirebaseRemoteConfig/EXFirebaseRemoteConfig.h>
#import <FirebaseRemoteConfig/FirebaseRemoteConfig.h>

NSString *convertFIRRemoteConfigFetchStatusToNSString(FIRRemoteConfigFetchStatus value) {
  switch (value) {
    case FIRRemoteConfigFetchStatusNoFetchYet:
      return @"config/no_fetch_yet";
    case FIRRemoteConfigFetchStatusSuccess:
      return @"config/success";
    case FIRRemoteConfigFetchStatusThrottled:
      return @"config/throttled";
    default:
      return @"config/failure";
  }
}

NSString *convertFIRRemoteConfigSourceToNSString(FIRRemoteConfigSource value) {
  switch (value) {
    case FIRRemoteConfigSourceDefault:
      return @"default";
    case FIRRemoteConfigSourceRemote:
      return @"remote";
    default:
      return @"static";
  }
}

NSDictionary *convertFIRRemoteConfigValueToNSDictionary(FIRRemoteConfigValue *value) {
  return @{@"stringValue": value.stringValue ?: [NSNull null], @"numberValue": value.numberValue ?: [NSNull null], @"dataValue": value.dataValue ? [value.dataValue base64EncodedStringWithOptions:0] : [NSNull null], @"boolValue": @(value.boolValue), @"source": convertFIRRemoteConfigSourceToNSString(value.source)};
}

@implementation EXFirebaseRemoteConfig

EX_EXPORT_MODULE(ExpoFirebaseRemoteConfig);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
}

EX_EXPORT_METHOD_AS(enableDeveloperMode,
                    enableDeveloperMode:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRRemoteConfigSettings *remoteConfigSettings = [[FIRRemoteConfigSettings alloc] initWithDeveloperModeEnabled:YES];
  [FIRRemoteConfig remoteConfig].configSettings = remoteConfigSettings;
  resolve(nil);
}

EX_EXPORT_METHOD_AS(fetch,
                    fetch:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[FIRRemoteConfig remoteConfig] fetchWithCompletionHandler:^(FIRRemoteConfigFetchStatus status, NSError *__nullable error) {
    if (error) {
      reject(convertFIRRemoteConfigFetchStatusToNSString(status), error.localizedDescription, error);
    } else {
      resolve(convertFIRRemoteConfigFetchStatusToNSString(status));
    }
  }];
}

EX_EXPORT_METHOD_AS(fetchWithExpirationDuration,
                    fetchWithExpirationDuration:(nonnull NSNumber *)expirationDuration
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[FIRRemoteConfig remoteConfig] fetchWithExpirationDuration:expirationDuration.doubleValue completionHandler:^(FIRRemoteConfigFetchStatus status, NSError *__nullable error) {
    if (error) {
      reject(convertFIRRemoteConfigFetchStatusToNSString(status), error.localizedDescription, error);
    } else {
      resolve(convertFIRRemoteConfigFetchStatusToNSString(status));
    }
  }];
}

EX_EXPORT_METHOD_AS(activateFetched,
                    activateFetched:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  BOOL status = [[FIRRemoteConfig remoteConfig] activateFetched];
  resolve(@(status));
}

EX_EXPORT_METHOD_AS(getValue,
                    getValue:(NSString *)key
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRRemoteConfigValue *value = [[FIRRemoteConfig remoteConfig] configValueForKey:key];
  resolve(convertFIRRemoteConfigValueToNSDictionary(value));
}

EX_EXPORT_METHOD_AS(getValues,
                    getValues:(NSArray *)keys
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  NSMutableArray *valuesArray = [[NSMutableArray alloc] init];
  for (NSString *key in keys) {
    FIRRemoteConfigValue *value = [[FIRRemoteConfig remoteConfig] configValueForKey:key];
    [valuesArray addObject:convertFIRRemoteConfigValueToNSDictionary(value)];
  }
  resolve(valuesArray);
}

EX_EXPORT_METHOD_AS(getKeysByPrefix,
                    getKeysByPrefix:(NSString *)prefix
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  NSSet *keys = [[FIRRemoteConfig remoteConfig] keysWithPrefix:prefix];
  NSMutableArray *keysArray = [[NSMutableArray alloc] init];
  for (NSString *key in keys) {
    [keysArray addObject:key];
  }
  resolve(keysArray);
}

EX_EXPORT_METHOD_AS(setDefaults,
                    setDefaults:(NSDictionary *)defaults
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[FIRRemoteConfig remoteConfig] setDefaults:defaults];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setDefaultsFromResource,
                    setDefaultsFromResource:(NSString *)fileName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [[FIRRemoteConfig remoteConfig] setDefaultsFromPlistFileName:fileName];
  resolve(nil);
}

@end
