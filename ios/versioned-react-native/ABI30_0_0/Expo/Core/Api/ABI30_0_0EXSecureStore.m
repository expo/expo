//
//  ABI30_0_0EXSecureStore.m
//  Exponent
//
//  Created by Craig Cronin on 7/14/17.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import "ABI30_0_0EXSecureStore.h"
#import "ABI30_0_0EXScopedModuleRegistry.h"

#import <CommonCrypto/CommonHMAC.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUtils.h>
#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>
#import <Security/Security.h>

@implementation ABI30_0_0RCTConvert (ABI30_0_0EXSecureStore)

ABI30_0_0RCT_ENUM_CONVERTER(ABI30_0_0EXSecureStoreAccessible, (@{
                                               @"AFTER_FIRST_UNLOCK":@(ABI30_0_0EXSecureStoreAccessibleAfterFirstUnlock),
                                               @"AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY":@(ABI30_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly),
                                               @"ALWAYS":@(ABI30_0_0EXSecureStoreAccessibleAlways),
                                               @"WHEN_PASSCODE_SET_THIS_DEVICE_ONLY":@(ABI30_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly),
                                               @"ALWAYS_THIS_DEVICE_ONLY":@(ABI30_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly),
                                               @"WHEN_UNLOCKED":@(ABI30_0_0EXSecureStoreAccessibleWhenUnlocked),
                                               @"WHEN_UNLOCKED_THIS_DEVICE_ONLY":@(ABI30_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly),
                                               }), ABI30_0_0EXSecureStoreAccessibleWhenUnlocked, integerValue)

@end

@implementation ABI30_0_0EXSecureStore

@synthesize bridge = _bridge;

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
  NSInteger accessibility = [ABI30_0_0RCTConvert NSInteger:options[@"keychainAccessible"]];
  switch (accessibility) {
    case ABI30_0_0EXSecureStoreAccessibleAfterFirstUnlock:
      return kSecAttrAccessibleAfterFirstUnlock;
    case ABI30_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly:
      return kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;
    case ABI30_0_0EXSecureStoreAccessibleAlways:
      return kSecAttrAccessibleAlways;
    case ABI30_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly:
      return kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly;
    case ABI30_0_0EXSecureStoreAccessibleWhenUnlocked:
      return kSecAttrAccessibleWhenUnlocked;
    case ABI30_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly:
      return kSecAttrAccessibleAlwaysThisDeviceOnly;
    case ABI30_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly:
      return kSecAttrAccessibleAlwaysThisDeviceOnly;
    default:
      return kSecAttrAccessibleWhenUnlocked;
  }
}

- (NSString *)_scopedKey:(NSString *)key {
  NSString *trimmedKey = [key stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
  if (!key || trimmedKey.length == 0) {
    return nil;
  }
  
  return [NSString stringWithFormat:@"%@-%@", self.experienceId, key];
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

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"AFTER_FIRST_UNLOCK":@(ABI30_0_0EXSecureStoreAccessibleAfterFirstUnlock),
           @"AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY":@(ABI30_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly),
           @"ALWAYS":@(ABI30_0_0EXSecureStoreAccessibleAlways),
           @"WHEN_PASSCODE_SET_THIS_DEVICE_ONLY":@(ABI30_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly),
           @"ALWAYS_THIS_DEVICE_ONLY":@(ABI30_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly),
           @"WHEN_UNLOCKED":@(ABI30_0_0EXSecureStoreAccessibleWhenUnlocked),
           @"WHEN_UNLOCKED_THIS_DEVICE_ONLY":@(ABI30_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly)
           };
};

ABI30_0_0EX_EXPORT_SCOPED_MODULE(ExponentSecureStore, nil);

ABI30_0_0RCT_EXPORT_METHOD(setValueWithKeyAsync:(NSString *)value
                  key:(NSString *)key
                  options:(NSDictionary *)options
                  resolver:(ABI30_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI30_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedKey = [self _scopedKey:key];
  if (!scopedKey) {
    reject(@"E_SECURESTORE_SETVALUEFAIL", nil, ABI30_0_0RCTErrorWithMessage(@"Invalid key."));
  } else {
    NSError *error;
    BOOL setValue = [self _setValue:value
                            withKey:scopedKey
                        withOptions:options
                              error:&error];
    if (setValue) {
      resolve(nil);
    } else {
      reject(@"E_SECURESTORE_SETVALUEFAIL", nil, ABI30_0_0RCTErrorWithMessage([[self class] _messageForError:error]));
    }
  }
}

ABI30_0_0RCT_EXPORT_METHOD(getValueWithKeyAsync:(NSString *)key
                  options:(NSDictionary *)options
                  resolver:(ABI30_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI30_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedKey = [self _scopedKey:key];
  if (!scopedKey) {
    reject(@"E_SECURESTORE_GETVALUEFAIL", nil, ABI30_0_0RCTErrorWithMessage(@"Invalid key."));
  } else {
    NSError *error;
    NSString *value = [self _getValueWithKey:scopedKey
                                 withOptions:options
                                       error:&error];
    if (error) {
      if (error.code == errSecItemNotFound) {
        resolve([NSNull null]);
      } else {
        reject(@"E_SECURESTORE_GETVALUEFAIL", nil, ABI30_0_0RCTErrorWithMessage([[self class] _messageForError:error]));
      }
    } else {
      resolve(value);
    }
  }
}

ABI30_0_0RCT_EXPORT_METHOD(deleteValueWithKeyAsync:(NSString *)key
                  options:(NSDictionary *)options
                  resolver:(ABI30_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI30_0_0RCTPromiseRejectBlock)reject)
{
  NSString *scopedKey = [self _scopedKey:key];
  if (!scopedKey) {
    reject(@"E_SECURESTORE_DELETEVALUEFAIL", nil, ABI30_0_0RCTErrorWithMessage(@"Invalid key."));
  } else {
    [self _deleteValueWithKey:scopedKey
                  withOptions:options];
    resolve(nil);
  }
}

@end
