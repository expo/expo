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

#import <Foundation/Foundation.h>

// The format of the debug code will show in the log as: e.g.
// for code 1000, it will show as I-IID001000.
typedef NS_ENUM(NSInteger, FIRInstanceIDMessageCode) {
  // DO NOT USE 2000, 2002.
  kFIRInstanceIDMessageCodeFIRApp000 = 1000,  // I-IID001000
  kFIRInstanceIDMessageCodeFIRApp001 = 1001,
  kFIRInstanceIDMessageCodeFIRApp002 = 1002,
  kFIRInstanceIDMessageCodeInternal001 = 2001,
  kFIRInstanceIDMessageCodeInternal002 = 2002,
  // FIRInstanceID.m
  // DO NOT USE 4000.
  kFIRInstanceIDMessageCodeInstanceID000 = 3000,
  kFIRInstanceIDMessageCodeInstanceID001 = 3001,
  kFIRInstanceIDMessageCodeInstanceID002 = 3002,
  kFIRInstanceIDMessageCodeInstanceID003 = 3003,
  kFIRInstanceIDMessageCodeInstanceID004 = 3004,
  kFIRInstanceIDMessageCodeInstanceID005 = 3005,
  kFIRInstanceIDMessageCodeInstanceID006 = 3006,
  kFIRInstanceIDMessageCodeInstanceID007 = 3007,
  kFIRInstanceIDMessageCodeInstanceID008 = 3008,
  kFIRInstanceIDMessageCodeInstanceID009 = 3009,
  kFIRInstanceIDMessageCodeInstanceID010 = 3010,
  kFIRInstanceIDMessageCodeInstanceID011 = 3011,
  kFIRInstanceIDMessageCodeInstanceID012 = 3012,
  kFIRInstanceIDMessageCodeInstanceID013 = 3013,
  kFIRInstanceIDMessageCodeInstanceID014 = 3014,
  kFIRInstanceIDMessageCodeInstanceID015 = 3015,
  kFIRInstanceIDMessageCodeRefetchingTokenForAPNS = 3016,
  kFIRInstanceIDMessageCodeInstanceID017 = 3017,
  kFIRInstanceIDMessageCodeInstanceID018 = 3018,
  // FIRInstanceIDAuthService.m
  kFIRInstanceIDMessageCodeAuthService000 = 5000,
  kFIRInstanceIDMessageCodeAuthService001 = 5001,
  kFIRInstanceIDMessageCodeAuthService002 = 5002,
  kFIRInstanceIDMessageCodeAuthService003 = 5003,
  kFIRInstanceIDMessageCodeAuthService004 = 5004,
  kFIRInstanceIDMessageCodeAuthServiceCheckinInProgress = 5004,

  // FIRInstanceIDBackupExcludedPlist.m
  kFIRInstanceIDMessageCodeBackupExcludedPlist000 = 6000,
  kFIRInstanceIDMessageCodeBackupExcludedPlist001 = 6001,
  kFIRInstanceIDMessageCodeBackupExcludedPlist002 = 6002,
  kFIRInstanceIDMessageCodeBackupExcludedPlistInvalidPlistEnum = 6003,
  // FIRInstanceIDCheckinService.m
  kFIRInstanceIDMessageCodeService000 = 7000,
  kFIRInstanceIDMessageCodeService001 = 7001,
  kFIRInstanceIDMessageCodeService002 = 7002,
  kFIRInstanceIDMessageCodeService003 = 7003,
  kFIRInstanceIDMessageCodeService004 = 7004,
  kFIRInstanceIDMessageCodeService005 = 7005,
  kFIRInstanceIDMessageCodeService006 = 7006,
  kFIRInstanceIDInvalidNetworkSession = 7007,
  kFIRInstanceIDInvalidSettingResponse = 7008,
  // FIRInstanceIDCheckinStore.m
  // DO NOT USE 8002, 8004 - 8008
  kFIRInstanceIDMessageCodeCheckinStore000 = 8000,
  kFIRInstanceIDMessageCodeCheckinStore001 = 8001,
  kFIRInstanceIDMessageCodeCheckinStore003 = 8003,
  kFIRInstanceIDMessageCodeCheckinStoreCheckinPlistDeleted = 8009,
  kFIRInstanceIDMessageCodeCheckinStoreCheckinPlistSaved = 8010,
  // FIRInstanceIDKeyPair.m
  // DO NOT USE 9001, 9003
  kFIRInstanceIDMessageCodeKeyPair000 = 9000,
  kFIRInstanceIDMessageCodeKeyPair002 = 9002,
  kFIRInstanceIDMessageCodeKeyPairMigrationError = 9004,
  kFIRInstanceIDMessageCodeKeyPairMigrationSuccess = 9005,
  kFIRInstanceIDMessageCodeKeyPairNoLegacyKeyPair = 9006,

  // FIRInstanceIDKeyPairStore.m
  kFIRInstanceIDMessageCodeKeyPairStore000 = 10000,
  kFIRInstanceIDMessageCodeKeyPairStore001 = 10001,
  kFIRInstanceIDMessageCodeKeyPairStore002 = 10002,
  kFIRInstanceIDMessageCodeKeyPairStore003 = 10003,
  kFIRInstanceIDMessageCodeKeyPairStore004 = 10004,
  kFIRInstanceIDMessageCodeKeyPairStore005 = 10005,
  kFIRInstanceIDMessageCodeKeyPairStore006 = 10006,
  kFIRInstanceIDMessageCodeKeyPairStore007 = 10007,
  kFIRInstanceIDMessageCodeKeyPairStore008 = 10008,
  kFIRInstanceIDMessageCodeKeyPairStoreCouldNotLoadKeyPair = 10009,
  // FIRInstanceIDKeyPairUtilities.m
  kFIRInstanceIDMessageCodeKeyPairUtilities000 = 11000,
  kFIRInstanceIDMessageCodeKeyPairUtilities001 = 11001,
  kFIRInstanceIDMessageCodeKeyPairUtilitiesFirstConcatenateParamNil = 11002,

  // DO NOT USE 12000 - 12014

  // FIRInstanceIDStore.m
  // DO NOT USE 13004, 13005, 13007, 13008, 13010, 13011, 13013, 13014
  kFIRInstanceIDMessageCodeStore000 = 13000,
  kFIRInstanceIDMessageCodeStore001 = 13001,
  kFIRInstanceIDMessageCodeStore002 = 13002,
  kFIRInstanceIDMessageCodeStore003 = 13003,
  kFIRInstanceIDMessageCodeStore006 = 13006,
  kFIRInstanceIDMessageCodeStore009 = 13009,
  kFIRInstanceIDMessageCodeStore012 = 13012,
  // FIRInstanceIDTokenManager.m
  // DO NOT USE 14002, 14005
  kFIRInstanceIDMessageCodeTokenManager000 = 14000,
  kFIRInstanceIDMessageCodeTokenManager001 = 14001,
  kFIRInstanceIDMessageCodeTokenManager003 = 14003,
  kFIRInstanceIDMessageCodeTokenManager004 = 14004,
  kFIRInstanceIDMessageCodeTokenManagerErrorDeletingFCMTokensOnAppReset = 14006,
  kFIRInstanceIDMessageCodeTokenManagerDeletedFCMTokensOnAppReset = 14007,
  kFIRInstanceIDMessageCodeTokenManagerSavedAppVersion = 14008,
  kFIRInstanceIDMessageCodeTokenManagerErrorInvalidatingAllTokens = 14009,
  kFIRInstanceIDMessageCodeTokenManagerAPNSChanged = 14010,
  kFIRInstanceIDMessageCodeTokenManagerAPNSChangedTokenInvalidated = 14011,
  kFIRInstanceIDMessageCodeTokenManagerInvalidateStaleToken = 14012,
  // FIRInstanceIDTokenStore.m
  // DO NOT USE 15002 - 15013
  kFIRInstanceIDMessageCodeTokenStore000 = 15000,
  kFIRInstanceIDMessageCodeTokenStore001 = 15001,
  kFIRInstanceIDMessageCodeTokenStoreExceptionUnarchivingTokenInfo = 15015,

  // DO NOT USE 16000, 18004

  // FIRInstanceIDUtilities.m
  kFIRInstanceIDMessageCodeUtilitiesMissingBundleIdentifier = 18000,
  kFIRInstanceIDMessageCodeUtilitiesAppEnvironmentUtilNotAvailable = 18001,
  kFIRInstanceIDMessageCodeUtilitiesCannotGetHardwareModel = 18002,
  kFIRInstanceIDMessageCodeUtilitiesCannotGetSystemVersion = 18003,
  // FIRInstanceIDTokenOperation.m
  kFIRInstanceIDMessageCodeTokenOperationFailedToSignParams = 19000,
  // FIRInstanceIDTokenFetchOperation.m
  // DO NOT USE 20004, 20005
  kFIRInstanceIDMessageCodeTokenFetchOperationFetchRequest = 20000,
  kFIRInstanceIDMessageCodeTokenFetchOperationRequestError = 20001,
  kFIRInstanceIDMessageCodeTokenFetchOperationBadResponse = 20002,
  kFIRInstanceIDMessageCodeTokenFetchOperationBadTokenStructure = 20003,
  // FIRInstanceIDTokenDeleteOperation.m
  kFIRInstanceIDMessageCodeTokenDeleteOperationFetchRequest = 21000,
  kFIRInstanceIDMessageCodeTokenDeleteOperationRequestError = 21001,
  kFIRInstanceIDMessageCodeTokenDeleteOperationBadResponse = 21002,
  // FIRInstanceIDTokenInfo.m
  kFIRInstanceIDMessageCodeTokenInfoBadAPNSInfo = 22000,
  kFIRInstanceIDMessageCodeTokenInfoFirebaseAppIDChanged = 22001,
  kFIRInstanceIDMessageCodeTokenInfoLocaleChanged = 22002,
  // FIRInstanceIDKeychain.m
  kFIRInstanceIDKeychainReadItemError = 23000,
  kFIRInstanceIDKeychainAddItemError = 23001,
  kFIRInstanceIDKeychainDeleteItemError = 23002,
  kFIRInstanceIDKeychainCreateKeyPairError = 23003,
  kFIRInstanceIDKeychainUpdateItemError = 23004,

  // FIRInstanceIDStringEncoding.m
  kFIRInstanceIDStringEncodingBufferUnderflow = 24000,
  kFIRInstanceIDStringEncodingBufferOverflow = 24001,

};
