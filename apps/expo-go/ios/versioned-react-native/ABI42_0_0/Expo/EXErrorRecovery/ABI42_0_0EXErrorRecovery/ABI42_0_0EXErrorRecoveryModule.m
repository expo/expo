// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXErrorRecovery/ABI42_0_0EXErrorRecoveryModule.h>

@implementation ABI42_0_0EXErrorRecoveryModule

ABI42_0_0UM_EXPORT_MODULE(ExpoErrorRecovery);

ABI42_0_0UM_EXPORT_METHOD_AS(saveRecoveryProps,
                    saveRecoveryProps:(NSString *)props
                    resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  if (props) {
    if (![self setRecoveryProps:props]) {
      return reject(@"E_ERROR_RECOVERY_SAVE_FAILED", @"Couldn't save props.", nil);
    }
  }
  resolve(nil);
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"recoveredProps": ABI42_0_0UMNullIfNil([self consumeRecoveryProps])
           };
}

- (BOOL)setRecoveryProps:(NSString *)props
{
  NSUserDefaults *preferences = [NSUserDefaults standardUserDefaults];
  [preferences setObject:props forKey:[self userDefaultsKey]];
  return [preferences synchronize];
}

- (NSString *)consumeRecoveryProps
{
  NSUserDefaults *preferences = [NSUserDefaults standardUserDefaults];
  NSString *props = [preferences stringForKey:[self userDefaultsKey]];
  if (props) {
    [preferences removeObjectForKey:[self userDefaultsKey]];
    [preferences synchronize];
  }
  return props;
}

- (NSString *)userDefaultsKey
{
  return NSStringFromClass([self class]);
}

@end
