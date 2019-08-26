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

#import "FIRInstanceIDTokenStore.h"

#import "FIRInstanceIDAuthKeyChain.h"
#import "FIRInstanceIDConstants.h"
#import "FIRInstanceIDLogger.h"
#import "FIRInstanceIDTokenInfo.h"
#import "FIRInstanceIDUtilities.h"

static NSString *const kFIRInstanceIDTokenKeychainId = @"com.google.iid-tokens";

@interface FIRInstanceIDTokenStore ()

@property(nonatomic, readwrite, strong) FIRInstanceIDAuthKeychain *keychain;

@end

@implementation FIRInstanceIDTokenStore

+ (instancetype)defaultStore {
  FIRInstanceIDAuthKeychain *tokenKeychain =
      [[FIRInstanceIDAuthKeychain alloc] initWithIdentifier:kFIRInstanceIDTokenKeychainId];
  return [[FIRInstanceIDTokenStore alloc] initWithKeychain:tokenKeychain];
}

- (instancetype)initWithKeychain:(FIRInstanceIDAuthKeychain *)keychain {
  self = [super init];
  if (self) {
    _keychain = keychain;
  }
  return self;
}

#pragma mark - Get

+ (NSString *)serviceKeyForAuthorizedEntity:(NSString *)authorizedEntity scope:(NSString *)scope {
  return [NSString stringWithFormat:@"%@:%@", authorizedEntity, scope];
}

- (nullable FIRInstanceIDTokenInfo *)tokenInfoWithAuthorizedEntity:(NSString *)authorizedEntity
                                                             scope:(NSString *)scope {
  NSString *account = FIRInstanceIDAppIdentifier();
  NSString *service = [[self class] serviceKeyForAuthorizedEntity:authorizedEntity scope:scope];
  NSData *item = [self.keychain dataForService:service account:account];
  if (!item) {
    return nil;
  }
  // Token infos created from legacy storage don't have appVersion, firebaseAppID, or APNSInfo.
  FIRInstanceIDTokenInfo *tokenInfo = [[self class] tokenInfoFromKeychainItem:item];
  return tokenInfo;
}

- (NSArray<FIRInstanceIDTokenInfo *> *)cachedTokenInfos {
  NSString *account = FIRInstanceIDAppIdentifier();
  NSArray<NSData *> *items =
      [self.keychain itemsMatchingService:kFIRInstanceIDKeychainWildcardIdentifier account:account];
  NSMutableArray<FIRInstanceIDTokenInfo *> *tokenInfos =
      [NSMutableArray arrayWithCapacity:items.count];
  for (NSData *item in items) {
    FIRInstanceIDTokenInfo *tokenInfo = [[self class] tokenInfoFromKeychainItem:item];
    if (tokenInfo) {
      [tokenInfos addObject:tokenInfo];
    }
  }
  return tokenInfos;
}

+ (nullable FIRInstanceIDTokenInfo *)tokenInfoFromKeychainItem:(NSData *)item {
  // Check if it is saved as an archived FIRInstanceIDTokenInfo, otherwise return nil.
  FIRInstanceIDTokenInfo *tokenInfo = nil;
  // NOTE: Passing in nil to unarchiveObjectWithData will result in an iOS error logged
  // in the console on iOS 10 and below. Avoid by checking item.data's existence.
  if (item) {
    @try {
      tokenInfo = [NSKeyedUnarchiver unarchiveObjectWithData:item];
    } @catch (NSException *exception) {
      FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeTokenStoreExceptionUnarchivingTokenInfo,
                               @"Unable to parse token info from Keychain item; item was in an "
                               @"invalid format");
      tokenInfo = nil;
    } @finally {
    }
  }
  return tokenInfo;
}

#pragma mark - Save
// Token Infos will be saved under these Keychain keys:
// Account: <Main App Bundle ID> (e.g. com.mycompany.myapp)
// Service: <Sender ID>:<Scope> (e.g. 1234567890:*)
- (void)saveTokenInfo:(FIRInstanceIDTokenInfo *)tokenInfo
              handler:(void (^)(NSError *))handler {  // Keep the cachetime up-to-date.
  tokenInfo.cacheTime = [NSDate date];
  // Always write to the Keychain, so that the cacheTime is up-to-date.
  NSData *tokenInfoData = [NSKeyedArchiver archivedDataWithRootObject:tokenInfo];
  NSString *account = FIRInstanceIDAppIdentifier();
  NSString *service = [[self class] serviceKeyForAuthorizedEntity:tokenInfo.authorizedEntity
                                                            scope:tokenInfo.scope];
  [self.keychain setData:tokenInfoData
              forService:service
           accessibility:NULL
                 account:account
                 handler:handler];
}

#pragma mark - Delete

- (void)removeTokenWithAuthorizedEntity:(nonnull NSString *)authorizedEntity
                                  scope:(nonnull NSString *)scope {
  NSString *account = FIRInstanceIDAppIdentifier();
  NSString *service = [[self class] serviceKeyForAuthorizedEntity:authorizedEntity scope:scope];
  [self.keychain removeItemsMatchingService:service account:account handler:nil];
}

- (void)removeAllTokensWithHandler:(void (^)(NSError *error))handler {
  NSString *account = FIRInstanceIDAppIdentifier();
  [self.keychain removeItemsMatchingService:kFIRInstanceIDKeychainWildcardIdentifier
                                    account:account
                                    handler:handler];
}

@end
