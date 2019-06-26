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

@class FIRInstanceIDKeyPair;
@class FIRInstanceIDCheckinPreferences;

NS_ASSUME_NONNULL_BEGIN

/**
 *  Represents the action taken on an FCM token.
 */
typedef NS_ENUM(NSInteger, FIRInstanceIDTokenAction) {
  FIRInstanceIDTokenActionFetch,
  FIRInstanceIDTokenActionDeleteToken,
  FIRInstanceIDTokenActionDeleteTokenAndIID,
};

/**
 * Represents the possible results of a token operation.
 */
typedef NS_ENUM(NSInteger, FIRInstanceIDTokenOperationResult) {
  FIRInstanceIDTokenOperationSucceeded,
  FIRInstanceIDTokenOperationError,
  FIRInstanceIDTokenOperationCancelled,
};

/**
 *  Callback to invoke once the HTTP call to FIRMessaging backend for updating
 *  subscription finishes.
 *
 *  @param result  The result of the operation.
 *  @param token   If the action for fetching a token and the request was successful, this will hold
 *                 the value of the token. Otherwise nil.
 *  @param error   The error which occurred while performing the token operation. This will be nil
 *                 in case the operation was successful, or if the operation was cancelled.
 */
typedef void (^FIRInstanceIDTokenOperationCompletion)(FIRInstanceIDTokenOperationResult result,
                                                      NSString *_Nullable token,
                                                      NSError *_Nullable error);

@interface FIRInstanceIDTokenOperation : NSOperation

@property(nonatomic, readonly) FIRInstanceIDTokenAction action;
@property(nonatomic, readonly, nullable) NSString *authorizedEntity;
@property(nonatomic, readonly, nullable) NSString *scope;
@property(nonatomic, readonly, nullable) NSDictionary<NSString *, NSString *> *options;
@property(nonatomic, readonly, strong) FIRInstanceIDCheckinPreferences *checkinPreferences;
@property(nonatomic, readonly, strong) FIRInstanceIDKeyPair *keyPair;

@property(nonatomic, readonly) FIRInstanceIDTokenOperationResult result;

- (instancetype)init NS_UNAVAILABLE;

- (void)addCompletionHandler:(FIRInstanceIDTokenOperationCompletion)handler;

@end

NS_ASSUME_NONNULL_END
