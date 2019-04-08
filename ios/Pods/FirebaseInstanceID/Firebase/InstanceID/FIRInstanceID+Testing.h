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

#import "FIRInstanceID+Private.h"
#import "FIRInstanceID.h"
#import "FIRInstanceIDKeyPairStore.h"
#import "FIRInstanceIDTokenManager.h"

@interface FIRInstanceID (Testing)

@property(nonatomic, readwrite, strong) FIRInstanceIDTokenManager *tokenManager;
@property(nonatomic, readwrite, strong) FIRInstanceIDKeyPairStore *keyPairStore;
@property(nonatomic, readwrite, copy) NSString *fcmSenderID;

/**
 *  Private initializer.
 */
- (instancetype)initPrivately;

/**
 *  Actually makes InstanceID instantiate both the IID and Token-related subsystems.
 */
- (void)start;

+ (int64_t)maxRetryCountForDefaultToken;
+ (int64_t)minIntervalForDefaultTokenRetry;
+ (int64_t)maxRetryIntervalForDefaultTokenInSeconds;

@end
