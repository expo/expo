/*
 * Copyright 2019 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "GoogleUtilities/Environment/Private/GULKeychainUtils.h"

NSString *const kGULKeychainUtilsErrorDomain = @"com.gul.keychain.ErrorDomain";

@implementation GULKeychainUtils

+ (nullable NSData *)getItemWithQuery:(NSDictionary *)query
                                error:(NSError *_Nullable *_Nullable)outError {
  NSMutableDictionary *mutableQuery = [query mutableCopy];

  mutableQuery[(__bridge id)kSecReturnData] = @YES;
  mutableQuery[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitOne;

  CFDataRef result = NULL;
  OSStatus status =
      SecItemCopyMatching((__bridge CFDictionaryRef)mutableQuery, (CFTypeRef *)&result);

  if (status == errSecSuccess && result != NULL) {
    if (outError) {
      *outError = nil;
    }

    return (__bridge_transfer NSData *)result;
  }

  if (status == errSecItemNotFound) {
    if (outError) {
      *outError = nil;
    }
  } else {
    if (outError) {
      *outError = [self keychainErrorWithFunction:@"SecItemCopyMatching" status:status];
    }
  }
  return nil;
}

+ (BOOL)setItem:(NSData *)item
      withQuery:(NSDictionary *)query
          error:(NSError *_Nullable *_Nullable)outError {
  NSData *existingItem = [self getItemWithQuery:query error:outError];
  if (outError && *outError) {
    return NO;
  }

  NSMutableDictionary *mutableQuery = [query mutableCopy];
  mutableQuery[(__bridge id)kSecAttrAccessible] =
      (__bridge id)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;

  OSStatus status;
  if (!existingItem) {
    mutableQuery[(__bridge id)kSecValueData] = item;
    status = SecItemAdd((__bridge CFDictionaryRef)mutableQuery, NULL);
  } else {
    NSDictionary *attributes = @{(__bridge id)kSecValueData : item};
    status = SecItemUpdate((__bridge CFDictionaryRef)query, (__bridge CFDictionaryRef)attributes);
  }

  if (status == noErr) {
    if (outError) {
      *outError = nil;
    }
    return YES;
  }

  NSString *function = existingItem ? @"SecItemUpdate" : @"SecItemAdd";
  if (outError) {
    *outError = [self keychainErrorWithFunction:function status:status];
  }
  return NO;
}

+ (BOOL)removeItemWithQuery:(NSDictionary *)query error:(NSError *_Nullable *_Nullable)outError {
  OSStatus status = SecItemDelete((__bridge CFDictionaryRef)query);

  if (status == noErr || status == errSecItemNotFound) {
    if (outError) {
      *outError = nil;
    }
    return YES;
  }

  if (outError) {
    *outError = [self keychainErrorWithFunction:@"SecItemDelete" status:status];
  }
  return NO;
}

#pragma mark - Errors

+ (NSError *)keychainErrorWithFunction:(NSString *)keychainFunction status:(OSStatus)status {
  NSString *failureReason = [NSString stringWithFormat:@"%@ (%li)", keychainFunction, (long)status];
  NSDictionary *userInfo = @{NSLocalizedFailureReasonErrorKey : failureReason};
  return [NSError errorWithDomain:kGULKeychainUtilsErrorDomain code:0 userInfo:userInfo];
}

@end
