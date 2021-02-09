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

FOUNDATION_EXPORT NSString *const kFIRInstanceIDDomain;

typedef NS_ENUM(NSUInteger, FIRInstanceIDErrorCode) {
  // Unknown error.
  kFIRInstanceIDErrorCodeUnknown = 0,

  // Http related errors.
  kFIRInstanceIDErrorCodeAuthentication = 1,
  kFIRInstanceIDErrorCodeNoAccess = 2,
  kFIRInstanceIDErrorCodeTimeout = 3,
  kFIRInstanceIDErrorCodeNetwork = 4,

  // Another operation is in progress.
  kFIRInstanceIDErrorCodeOperationInProgress = 5,

  // Failed to perform device check in.
  kFIRInstanceIDErrorCodeRegistrarFailedToCheckIn = 6,

  kFIRInstanceIDErrorCodeInvalidRequest = 7,

  // InstanceID generic errors
  kFIRInstanceIDErrorCodeMissingDeviceID = 501,

  // InstanceID Token specific errors
  kFIRInstanceIDErrorCodeMissingAPNSToken = 1001,
  kFIRInstanceIDErrorCodeMissingAPNSServerType = 1002,
  kFIRInstanceIDErrorCodeInvalidAuthorizedEntity = 1003,
  kFIRInstanceIDErrorCodeInvalidScope = 1004,
  kFIRInstanceIDErrorCodeInvalidStart = 1005,
  kFIRInstanceIDErrorCodeInvalidKeyPair = 1006,

  // InstanceID Identity specific errors
  // Generic InstanceID keypair error
  kFIRInstanceIDErrorCodeMissingKeyPair = 2001,
  kFIRInstanceIDErrorCodeInvalidKeyPairTags = 2002,
  kFIRInstanceIDErrorCodeInvalidKeyPairCreationTime = 2005,
  kFIRInstanceIDErrorCodeInvalidIdentity = 2006,

};

@interface NSError (FIRInstanceID)

@property(nonatomic, readonly) FIRInstanceIDErrorCode instanceIDErrorCode;

+ (NSError *)errorWithFIRInstanceIDErrorCode:(FIRInstanceIDErrorCode)errorCode;

+ (NSError *)errorWithFIRInstanceIDErrorCode:(FIRInstanceIDErrorCode)errorCode
                                    userInfo:(NSDictionary *)userInfo;

+ (NSError *)FIRInstanceIDErrorMissingCheckin;

@end
