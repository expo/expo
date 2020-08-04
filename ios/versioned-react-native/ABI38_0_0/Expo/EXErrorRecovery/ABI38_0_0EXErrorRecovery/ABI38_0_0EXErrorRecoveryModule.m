// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXErrorRecovery/ABI38_0_0EXErrorRecoveryModule.h>

@implementation ABI38_0_0EXErrorRecoveryModule

ABI38_0_0UM_EXPORT_MODULE(ExpoErrorRecovery);

ABI38_0_0UM_EXPORT_METHOD_AS(saveRecoveryProps,
                    saveRecoveryProps:(NSString *)props
                    resolve:(ABI38_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI38_0_0UMPromiseRejectBlock)reject)
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
           @"recoveredProps": ABI38_0_0UMNullIfNil([self consumeRecoveryProps])
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
