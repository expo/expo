/*! @file GTMKeychain_iOS.m
    @brief GTMAppAuth SDK
    @copyright
        Copyright 2016 Google Inc.
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */

#import "GTMKeychain.h"

#import <Security/Security.h>

typedef NS_ENUM(NSInteger, GTMAppAuthFetcherAuthorizationGTMAppAuthGTMOAuth2KeychainError) {
  GTMAppAuthGTMOAuth2KeychainErrorBadArguments = -1301,
  GTMAppAuthGTMOAuth2KeychainErrorNoPassword = -1302
};

/*! @brief Keychain helper class.
 */
@interface GTMAppAuthGTMOAuth2Keychain : NSObject

+ (GTMAppAuthGTMOAuth2Keychain *)defaultKeychain;

// OK to pass nil for the error parameter.
- (NSString *)passwordForService:(NSString *)service
                         account:(NSString *)account
                           error:(NSError **)error;

- (NSData *)passwordDataForService:(NSString *)service
                             account:(NSString *)account
                               error:(NSError **)error;

// OK to pass nil for the error parameter.
- (BOOL)removePasswordForService:(NSString *)service
                         account:(NSString *)account
                           error:(NSError **)error;

// OK to pass nil for the error parameter.
//
// accessibility should be one of the constants for kSecAttrAccessible
// such as kSecAttrAccessibleWhenUnlocked
- (BOOL)setPassword:(NSString *)password
         forService:(NSString *)service
      accessibility:(CFTypeRef)accessibility
            account:(NSString *)account
              error:(NSError **)error;

- (BOOL)setPasswordData:(NSData *)passwordData
             forService:(NSString *)service
          accessibility:(CFTypeRef)accessibility
                account:(NSString *)account
                  error:(NSError **)error;

// For unit tests: allow setting a mock object
+ (void)setDefaultKeychain:(GTMAppAuthGTMOAuth2Keychain *)keychain;

@end

NSString *const kGTMAppAuthFetcherAuthorizationGTMOAuth2ErrorDomain  = @"com.google.GTMOAuth2";
NSString *const kGTMAppAuthFetcherAuthorizationGTMOAuth2KeychainErrorDomain =
    @"com.google.GTMOAuthKeychain";
static NSString *const kGTMAppAuthFetcherAuthorizationGTMOAuth2AccountName = @"OAuth";
static GTMAppAuthGTMOAuth2Keychain* gGTMAppAuthFetcherAuthorizationGTMOAuth2DefaultKeychain = nil;

@implementation GTMKeychain

+ (BOOL)removePasswordFromKeychainForName:(NSString *)keychainItemName {
  GTMAppAuthGTMOAuth2Keychain *keychain = [GTMAppAuthGTMOAuth2Keychain defaultKeychain];
  return [keychain removePasswordForService:keychainItemName
                                    account:kGTMAppAuthFetcherAuthorizationGTMOAuth2AccountName
                                      error:nil];
}

+ (NSString *)passwordFromKeychainForName:(NSString *)keychainItemName {
  GTMAppAuthGTMOAuth2Keychain *keychain = [GTMAppAuthGTMOAuth2Keychain defaultKeychain];
  NSError *error;
  NSString *password =
      [keychain passwordForService:keychainItemName
                           account:kGTMAppAuthFetcherAuthorizationGTMOAuth2AccountName
                             error:&error];
  return password;
}

+ (BOOL)savePasswordToKeychainForName:(NSString *)keychainItemName password:(NSString *)password {
  return [self savePasswordToKeychainForName:keychainItemName
                                    password:password
                               accessibility:NULL
                                       error:NULL];
}

+ (BOOL)savePasswordToKeychainForName:(NSString *)keychainItemName password:(NSString *)password
                    accessibility:(CFTypeRef)accessibility
                            error:(NSError **)error {
  if (accessibility == NULL) {
    accessibility = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;
  }
  // make a response string containing the values we want to save
  GTMAppAuthGTMOAuth2Keychain *keychain = [GTMAppAuthGTMOAuth2Keychain defaultKeychain];
  return [keychain setPassword:password
                    forService:keychainItemName
                 accessibility:accessibility
                       account:kGTMAppAuthFetcherAuthorizationGTMOAuth2AccountName
                         error:error];
}

/*! @brief Saves the password string to the keychain with the given identifier.
    @param keychainItemName Keychain name of the item.
    @param password Password string to save.
    @return YES when the password string was saved successfully.
 */
+ (BOOL)savePasswordDataToKeychainForName:(NSString *)keychainItemName
                             passwordData:(NSData *)password {
  CFTypeRef accessibility = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;
  // make a response string containing the values we want to save
  GTMAppAuthGTMOAuth2Keychain *keychain = [GTMAppAuthGTMOAuth2Keychain defaultKeychain];
  return [keychain setPasswordData:password
                        forService:keychainItemName
                     accessibility:accessibility
                           account:kGTMAppAuthFetcherAuthorizationGTMOAuth2AccountName
                             error:NULL];
}

/*! @brief Loads the password string from the keychain with the given identifier.
    @param keychainItemName Keychain name of the item.
    @return The password string at the given identifier, or nil.
 */
+ (NSData *)passwordDataFromKeychainForName:(NSString *)keychainItemName {
  GTMAppAuthGTMOAuth2Keychain *keychain = [GTMAppAuthGTMOAuth2Keychain defaultKeychain];
  NSError *error;
  NSData *password =
      [keychain passwordDataForService:keychainItemName
                               account:kGTMAppAuthFetcherAuthorizationGTMOAuth2AccountName
                                 error:&error];
  return password;
}

@end

#pragma mark GTMAppAuthGTMOAuth2Keychain

@implementation GTMAppAuthGTMOAuth2Keychain

+ (GTMAppAuthGTMOAuth2Keychain *)defaultKeychain {
  static dispatch_once_t onceToken;
  dispatch_once (&onceToken, ^{
    gGTMAppAuthFetcherAuthorizationGTMOAuth2DefaultKeychain = [[self alloc] init];
  });
  return gGTMAppAuthFetcherAuthorizationGTMOAuth2DefaultKeychain;
}


// For unit tests: allow setting a mock object
+ (void)setDefaultKeychain:(GTMAppAuthGTMOAuth2Keychain *)keychain {
  if (gGTMAppAuthFetcherAuthorizationGTMOAuth2DefaultKeychain != keychain) {
    gGTMAppAuthFetcherAuthorizationGTMOAuth2DefaultKeychain = keychain;
  }
}

- (NSString *)keyForService:(NSString *)service account:(NSString *)account {
  return [NSString stringWithFormat:@"com.google.GTMOAuth.%@%@", service, account];
}

+ (NSMutableDictionary *)keychainQueryForService:(NSString *)service account:(NSString *)account {
  NSMutableDictionary *query =
      [NSMutableDictionary dictionaryWithObjectsAndKeys:(id)kSecClassGenericPassword, (id)kSecClass,
                                                        @"OAuth", (id)kSecAttrGeneric,
                                                        account, (id)kSecAttrAccount,
                                                        service, (id)kSecAttrService,
                                                        nil];
  return query;
}

- (NSMutableDictionary *)keychainQueryForService:(NSString *)service account:(NSString *)account {
  return [[self class] keychainQueryForService:service account:account];
}

// iPhone
- (NSString *)passwordForService:(NSString *)service
                         account:(NSString *)account
                           error:(NSError **)error {
  NSData *passwordData = [self passwordDataForService:service account:account error:error];
  if (!passwordData) {
    return nil;
  }
  NSString *result = [[NSString alloc] initWithData:passwordData
                                           encoding:NSUTF8StringEncoding];
  return result;
}

// iPhone
- (NSData *)passwordDataForService:(NSString *)service
                           account:(NSString *)account
                             error:(NSError **)error {
  OSStatus status = GTMAppAuthGTMOAuth2KeychainErrorBadArguments;
  NSData *result = nil;
  if (service.length > 0 && account.length > 0) {
    CFDataRef passwordData = NULL;
    NSMutableDictionary *keychainQuery = [self keychainQueryForService:service account:account];
    [keychainQuery setObject:(id)kCFBooleanTrue forKey:(id)kSecReturnData];
    [keychainQuery setObject:(id)kSecMatchLimitOne forKey:(id)kSecMatchLimit];

    status = SecItemCopyMatching((CFDictionaryRef)keychainQuery,
                                       (CFTypeRef *)&passwordData);
    if (status == noErr && 0 < [(__bridge NSData *)passwordData length]) {
      result = [(__bridge NSData *)passwordData copy];
    }
    if (passwordData != NULL) {
      CFRelease(passwordData);
    }
  }
  if (status != noErr && error != NULL) {
    *error = [NSError errorWithDomain:kGTMAppAuthFetcherAuthorizationGTMOAuth2KeychainErrorDomain
                                 code:status
                             userInfo:nil];
  }
  return result;
}

// iPhone
- (BOOL)removePasswordForService:(NSString *)service
                         account:(NSString *)account
                           error:(NSError **)error {
  OSStatus status = GTMAppAuthGTMOAuth2KeychainErrorBadArguments;
  if (0 < [service length] && 0 < [account length]) {
    NSMutableDictionary *keychainQuery = [self keychainQueryForService:service account:account];
    status = SecItemDelete((CFDictionaryRef)keychainQuery);
  }
  if (status != noErr && error != NULL) {
    *error = [NSError errorWithDomain:kGTMAppAuthFetcherAuthorizationGTMOAuth2KeychainErrorDomain
                                 code:status
                             userInfo:nil];
  }
  return status == noErr;
}

// iPhone
- (BOOL)setPassword:(NSString *)password
         forService:(NSString *)service
      accessibility:(CFTypeRef)accessibility
            account:(NSString *)account
              error:(NSError **)error {
  NSData *passwordData = [password dataUsingEncoding:NSUTF8StringEncoding];
  return [self setPasswordData:passwordData
                    forService:service
                 accessibility:accessibility
                       account:account
                         error:error];
}

- (BOOL)setPasswordData:(NSData *)passwordData
             forService:(NSString *)service
          accessibility:(CFTypeRef)accessibility
                account:(NSString *)account
                  error:(NSError **)error {
  OSStatus status = GTMAppAuthGTMOAuth2KeychainErrorBadArguments;
  if (0 < [service length] && 0 < [account length]) {
    [self removePasswordForService:service account:account error:nil];
    if (0 < [passwordData length]) {
      NSMutableDictionary *keychainQuery = [self keychainQueryForService:service account:account];
      [keychainQuery setObject:passwordData forKey:(id)kSecValueData];

      if (accessibility != NULL) {
        [keychainQuery setObject:(__bridge id)accessibility
                          forKey:(id)kSecAttrAccessible];
      }
      status = SecItemAdd((CFDictionaryRef)keychainQuery, NULL);
    }
  }
  if (status != noErr && error != NULL) {
    *error = [NSError errorWithDomain:kGTMAppAuthFetcherAuthorizationGTMOAuth2KeychainErrorDomain
                                 code:status
                             userInfo:nil];
  }
  return status == noErr;
}

@end
