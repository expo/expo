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

#import "FIRInstanceIDTokenOperation.h"

#import "FIRInstanceIDUtilities.h"

@class FIRInstanceIDKeyPair;
@class FIRInstanceIDURLQueryItem;

NS_ASSUME_NONNULL_BEGIN

@interface FIRInstanceIDTokenOperation (Private)

@property(atomic, strong) NSURLSessionDataTask *dataTask;
@property(readonly, strong)
    NSMutableArray<FIRInstanceIDTokenOperationCompletion> *completionHandlers;

// For testing only
@property(nonatomic, readwrite, copy) FIRInstanceIDURLRequestTestBlock testBlock;

+ (NSURLSession *)sharedURLSession;

#pragma mark - Initialization
- (instancetype)initWithAction:(FIRInstanceIDTokenAction)action
           forAuthorizedEntity:(nullable NSString *)authorizedEntity
                         scope:(NSString *)scope
                       options:(nullable NSDictionary<NSString *, NSString *> *)options
            checkinPreferences:(FIRInstanceIDCheckinPreferences *)checkinPreferences
                       keyPair:(FIRInstanceIDKeyPair *)keyPair;

#pragma mark - Request Construction
+ (NSMutableURLRequest *)requestWithAuthHeader:(NSString *)authHeaderString;
+ (NSMutableArray<FIRInstanceIDURLQueryItem *> *)standardQueryItemsWithDeviceID:(NSString *)deviceID
                                                                          scope:(NSString *)scope;
- (NSArray<FIRInstanceIDURLQueryItem *> *)queryItemsWithKeyPair:(FIRInstanceIDKeyPair *)keyPair;

#pragma mark - HTTP Headers
/**
 *  Given a valid checkin preferences object, it will return a string that can be used
 *  in the "Authorization" HTTP header to authenticate this request.
 *
 *  @param checkin The valid checkin preferences object, with a deviceID and secretToken.
 */
+ (NSString *)HTTPAuthHeaderFromCheckin:(FIRInstanceIDCheckinPreferences *)checkin;

#pragma mark - Result
- (void)finishWithResult:(FIRInstanceIDTokenOperationResult)result
                   token:(nullable NSString *)token
                   error:(nullable NSError *)error;

@end

NS_ASSUME_NONNULL_END
