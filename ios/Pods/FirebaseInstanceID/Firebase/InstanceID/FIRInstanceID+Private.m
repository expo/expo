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

#import "FIRInstanceIDAuthService.h"
#import "FIRInstanceIDKeyPairStore.h"
#import "FIRInstanceIDTokenManager.h"

@interface FIRInstanceID ()

@property(nonatomic, readonly, strong) FIRInstanceIDTokenManager *tokenManager;
@property(nonatomic, readonly, strong) FIRInstanceIDKeyPairStore *keyPairStore;

@end

@implementation FIRInstanceID (Private)

- (FIRInstanceIDCheckinPreferences *)cachedCheckinPreferences {
  return [self.tokenManager.authService checkinPreferences];
}

// This method just wraps our pre-configured auth service to make the request.
// This method is only needed by first-party users, like Remote Config.
- (void)fetchCheckinInfoWithHandler:(FIRInstanceIDDeviceCheckinCompletion)handler {
  [self.tokenManager.authService fetchCheckinInfoWithHandler:handler];
}

- (NSString *)appInstanceID:(NSError **)error {
  return [self.keyPairStore appIdentityWithError:error];
}

@end
