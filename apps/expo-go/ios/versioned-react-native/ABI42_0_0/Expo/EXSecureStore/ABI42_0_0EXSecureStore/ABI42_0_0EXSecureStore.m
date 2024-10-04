//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI42_0_0EXSecureStore/ABI42_0_0EXSecureStore.h>

#import <CommonCrypto/CommonHMAC.h>
#import <Security/Security.h>

@implementation ABI42_0_0EXSecureStore

#pragma mark - internal

- (NSMutableDictionary *)_queryWithKey:(NSString *)key withOptions:(NSDictionary *)options
{
  NSString *service = (NSString *) options[@"keychainService"] ? (NSString *) options[@"keychainService"]:@"app";
  NSData *encodedKey = [key dataUsingEncoding:NSUTF8StringEncoding];
  NSMutableDictionary *query = [@{
                                  (__bridge id)kSecClass:(__bridge id)kSecClassGenericPassword,
                                  (__bridge id)kSecAttrService:service,
                                  (__bridge id)kSecAttrGeneric:encodedKey,
                                  (__bridge id)kSecAttrAccount:encodedKey
                                  } mutableCopy];

  return query;
}

- (BOOL)_setValue:(NSString *)value withKey:(NSString *)key withOptions:(NSDictionary *)options error:(NSError **)error
{
  NSMutableDictionary *dictionary = [self _queryWithKey:key
                                            withOptions:options];

  NSData *valueData = [value dataUsingEncoding:NSUTF8StringEncoding];
  [dictionary setObject:valueData forKey:(__bridge id)kSecValueData];

  CFStringRef accessibility = [self _accessibilityAttributeWithOptions:options];
  [dictionary setObject:(__bridge id)accessibility forKey:(__bridge id)kSecAttrAccessible];

  OSStatus status = SecItemAdd((__bridge CFDictionaryRef)dictionary, NULL);

  if (status == errSecSuccess) {
    return YES;
  } else if (status == errSecDuplicateItem){
    NSError *updateError;
    BOOL update = [self _updateValue:value
                             withKey:key
                         withOptions:options
                               error:&updateError];
    *error = updateError;
    return update;
  } else {
    *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
    return NO;
  }
}

- (NSString *)_getValueWithKey:(NSString *)key withOptions:(NSDictionary *)options error:(NSError **)error
{
  NSError *searchError;
  NSData *data = [self _searchKeychainWithKey:key
                                  withOptions:options
                                        error:&searchError];
  if (data) {
    NSString *value = [[NSString alloc] initWithData:data
                                            encoding:NSUTF8StringEncoding];
    return value;
  } else {
    *error = searchError;
    return nil;
  }
}

- (BOOL)_updateValue:(NSString *)value withKey:(NSString *)key withOptions:(NSDictionary *)options error:(NSError **)error
{
  NSMutableDictionary *searchDictionary = [self _queryWithKey:key
                                                  withOptions:options];
  NSData *valueData = [value dataUsingEncoding:NSUTF8StringEncoding];
  NSDictionary *updateDictionary = @{(__bridge id)kSecValueData:valueData};

  OSStatus status = SecItemUpdate((__bridge CFDictionaryRef)searchDictionary,
                                  (__bridge CFDictionaryRef)updateDictionary);

  if (status == errSecSuccess) {
    return YES;
  } else {
    *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
    return NO;
  }
}

- (NSData *)_searchKeychainWithKey:(NSString *)key withOptions:(NSDictionary *)options error:(NSError **)error
{
  NSMutableDictionary *searchDictionary = [self _queryWithKey:key
                                                  withOptions:options];

  [searchDictionary setObject:(__bridge id)kSecMatchLimitOne forKey:(__bridge id)kSecMatchLimit];
  [searchDictionary setObject:(__bridge id)kCFBooleanTrue forKey:(__bridge id)kSecReturnData];

  CFTypeRef foundDict = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)searchDictionary, &foundDict);

  if (status == noErr) {
    NSData *result = (__bridge_transfer NSData *)foundDict;
    return result;
  } else {
    *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
    return nil;
  }
}

- (void)_deleteValueWithKey:(NSString *)key withOptions:(NSDictionary *)options
{
  NSMutableDictionary *searchDictionary = [self _queryWithKey:key
                                                  withOptions:options];
  CFDictionaryRef dictionary = (__bridge CFDictionaryRef)searchDictionary;

  SecItemDelete(dictionary);
}

- (CFStringRef)_accessibilityAttributeWithOptions:(NSDictionary *)options
{
  NSInteger accessibility = [options[@"keychainAccessible"] integerValue];
  switch (accessibility) {
    case ABI42_0_0EXSecureStoreAccessibleAfterFirstUnlock:
      return kSecAttrAccessibleAfterFirstUnlock;
    case ABI42_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly:
      return kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;
    case ABI42_0_0EXSecureStoreAccessibleAlways:
      return kSecAttrAccessibleAlways;
    case ABI42_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly:
      return kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly;
    case ABI42_0_0EXSecureStoreAccessibleWhenUnlocked:
      return kSecAttrAccessibleWhenUnlocked;
    case ABI42_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly:
      return kSecAttrAccessibleAlwaysThisDeviceOnly;
    case ABI42_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly:
      return kSecAttrAccessibleWhenUnlockedThisDeviceOnly;
    default:
      return kSecAttrAccessibleWhenUnlocked;
  }
}

+ (NSString *) _messageForError:(NSError *)error
{
  switch (error.code) {
    case errSecUnimplemented:
      return @"Function or operation not implemented.";

    case errSecIO:
      return @"I/O error.";

    case errSecOpWr:
      return @"File already open with with write permission.";

    case errSecParam:
      return @"One or more parameters passed to a function where not valid.";

    case errSecAllocate:
      return @"Failed to allocate memory.";

    case errSecUserCanceled:
      return @"User canceled the operation.";

    case errSecBadReq:
      return @"Bad parameter or invalid state for operation.";

    case errSecNotAvailable:
      return @"No keychain is available. You may need to restart your computer.";

    case errSecDuplicateItem:
      return @"The specified item already exists in the keychain.";

    case errSecItemNotFound:
      return @"The specified item could not be found in the keychain.";

    case errSecInteractionNotAllowed:
      return @"User interaction is not allowed.";

    case errSecDecode:
      return @"Unable to decode the provided data.";

    case errSecAuthFailed:
      return @"The user name or passphrase you entered is not correct.";

    default:
      return error.localizedDescription;
  }
}

#pragma mark - SecureStore API

- (NSDictionary *)constantsToExport
{
  return @{
           @"AFTER_FIRST_UNLOCK":@(ABI42_0_0EXSecureStoreAccessibleAfterFirstUnlock),
           @"AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY":@(ABI42_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly),
           @"ALWAYS":@(ABI42_0_0EXSecureStoreAccessibleAlways),
           @"WHEN_PASSCODE_SET_THIS_DEVICE_ONLY":@(ABI42_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly),
           @"ALWAYS_THIS_DEVICE_ONLY":@(ABI42_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly),
           @"WHEN_UNLOCKED":@(ABI42_0_0EXSecureStoreAccessibleWhenUnlocked),
           @"WHEN_UNLOCKED_THIS_DEVICE_ONLY":@(ABI42_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly)
           };
};

ABI42_0_0UM_EXPORT_MODULE(ExpoSecureStore);

ABI42_0_0UM_EXPORT_METHOD_AS(setValueWithKeyAsync,
                    setValueWithKeyAsync:(NSString *)value
                    key:(NSString *)key
                    options:(NSDictionary *)options
                    resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  NSString *validatedKey = [self validatedKey:key];
  if (!validatedKey) {
    reject(@"E_SECURESTORE_SETVALUEFAIL", nil, ABI42_0_0UMErrorWithMessage(@"Invalid key."));
  } else {
    NSError *error;
    BOOL setValue = [self _setValue:value
                            withKey:validatedKey
                        withOptions:options
                              error:&error];
    if (setValue) {
      resolve(nil);
    } else {
      reject(@"E_SECURESTORE_SETVALUEFAIL", nil, ABI42_0_0UMErrorWithMessage([[self class] _messageForError:error]));
    }
  }
}

ABI42_0_0UM_EXPORT_METHOD_AS(getValueWithKeyAsync,
                    getValueWithKeyAsync:(NSString *)key
                    options:(NSDictionary *)options
                    resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  NSString *validatedKey = [self validatedKey:key];
  if (!validatedKey) {
    reject(@"E_SECURESTORE_GETVALUEFAIL", nil, ABI42_0_0UMErrorWithMessage(@"Invalid key."));
  } else {
    NSError *error;
    NSString *value = [self _getValueWithKey:validatedKey
                                 withOptions:options
                                       error:&error];
    if (error) {
      if (error.code == errSecItemNotFound) {
        resolve([NSNull null]);
      } else {
        reject(@"E_SECURESTORE_GETVALUEFAIL", nil, ABI42_0_0UMErrorWithMessage([[self class] _messageForError:error]));
      }
    } else {
      resolve(value);
    }
  }
}

ABI42_0_0UM_EXPORT_METHOD_AS(deleteValueWithKeyAsync,
                    deleteValueWithKeyAsync:(NSString *)key
                    options:(NSDictionary *)options
                    resolver:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  NSString *validatedKey = [self validatedKey:key];
  if (!validatedKey) {
    reject(@"E_SECURESTORE_DELETEVALUEFAIL", nil, ABI42_0_0UMErrorWithMessage(@"Invalid key."));
  } else {
    [self _deleteValueWithKey:validatedKey
                  withOptions:options];
    resolve(nil);
  }
}

- (NSString *)validatedKey:(NSString *)key
{
  NSString *trimmedKey = [key stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
  if (!key || trimmedKey.length == 0) {
    return nil;
  }
  return key;
}

@end
