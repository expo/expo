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

#import "NSError+FIRInstanceID.h"

NSString *const kFIRInstanceIDDomain = @"com.firebase.iid";

@implementation NSError (FIRInstanceID)

- (FIRInstanceIDErrorCode)instanceIDErrorCode {
  return (FIRInstanceIDErrorCode)self.code;
}

+ (NSError *)errorWithFIRInstanceIDErrorCode:(FIRInstanceIDErrorCode)errorCode {
  return [NSError errorWithFIRInstanceIDErrorCode:errorCode userInfo:nil];
}

+ (NSError *)errorWithFIRInstanceIDErrorCode:(FIRInstanceIDErrorCode)errorCode
                                    userInfo:(NSDictionary *)userInfo {
  return [NSError errorWithDomain:kFIRInstanceIDDomain code:errorCode userInfo:userInfo];
}

+ (NSError *)FIRInstanceIDErrorMissingCheckin {
  NSDictionary *userInfo = @{@"msg" : @"Missing device credentials. Retry later."};

  return [NSError errorWithDomain:kFIRInstanceIDDomain
                             code:kFIRInstanceIDErrorCodeMissingDeviceID
                         userInfo:userInfo];
}

@end
