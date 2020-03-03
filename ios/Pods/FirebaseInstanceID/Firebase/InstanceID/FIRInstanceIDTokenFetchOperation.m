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

#import "FIRInstanceIDTokenFetchOperation.h"

#import "FIRInstanceIDCheckinPreferences.h"
#import "FIRInstanceIDConstants.h"
#import "FIRInstanceIDDefines.h"
#import "FIRInstanceIDLogger.h"
#import "FIRInstanceIDTokenOperation+Private.h"
#import "FIRInstanceIDURLQueryItem.h"
#import "FIRInstanceIDUtilities.h"
#import "NSError+FIRInstanceID.h"

#import <FirebaseCore/FIRAppInternal.h>
#import <FirebaseCore/FIRHeartbeatInfo.h>

// We can have a static int since this error should theoretically only
// happen once (for the first time). If it repeats there is something
// else that is wrong.
static int phoneRegistrationErrorRetryCount = 0;
static const int kMaxPhoneRegistrationErrorRetryCount = 10;
NSString *const kFIRInstanceIDFirebaseUserAgentKey = @"X-firebase-client";
NSString *const kFIRInstanceIDFirebaseHeartbeatKey = @"X-firebase-client-log-type";
NSString *const kFIRInstanceIDHeartbeatTag = @"fire-iid";

@implementation FIRInstanceIDTokenFetchOperation

- (instancetype)initWithAuthorizedEntity:(NSString *)authorizedEntity
                                   scope:(NSString *)scope
                                 options:(nullable NSDictionary<NSString *, NSString *> *)options
                      checkinPreferences:(FIRInstanceIDCheckinPreferences *)checkinPreferences
                                 keyPair:(FIRInstanceIDKeyPair *)keyPair {
  self = [super initWithAction:FIRInstanceIDTokenActionFetch
           forAuthorizedEntity:authorizedEntity
                         scope:scope
                       options:options
            checkinPreferences:checkinPreferences
                       keyPair:keyPair];
  if (self) {
  }
  return self;
}

- (void)performTokenOperation {
  NSString *authHeader =
      [FIRInstanceIDTokenOperation HTTPAuthHeaderFromCheckin:self.checkinPreferences];
  NSMutableURLRequest *request = [[self class] requestWithAuthHeader:authHeader];
  NSString *checkinVersionInfo = self.checkinPreferences.versionInfo;
  [request setValue:checkinVersionInfo forHTTPHeaderField:@"info"];
  [request setValue:[FIRApp firebaseUserAgent]
      forHTTPHeaderField:kFIRInstanceIDFirebaseUserAgentKey];
  [request setValue:@([FIRHeartbeatInfo heartbeatCodeForTag:kFIRInstanceIDHeartbeatTag]).stringValue
      forHTTPHeaderField:kFIRInstanceIDFirebaseHeartbeatKey];

  // Build form-encoded body
  NSString *deviceAuthID = self.checkinPreferences.deviceID;
  NSMutableArray<FIRInstanceIDURLQueryItem *> *queryItems =
      [[self class] standardQueryItemsWithDeviceID:deviceAuthID scope:self.scope];
  [queryItems addObject:[FIRInstanceIDURLQueryItem queryItemWithName:@"sender"
                                                               value:self.authorizedEntity]];
  [queryItems addObject:[FIRInstanceIDURLQueryItem queryItemWithName:@"X-subtype"
                                                               value:self.authorizedEntity]];

  [queryItems addObjectsFromArray:[self queryItemsWithKeyPair:self.keyPair]];

  // Create query items from passed-in options
  id apnsTokenData = self.options[kFIRInstanceIDTokenOptionsAPNSKey];
  id apnsSandboxValue = self.options[kFIRInstanceIDTokenOptionsAPNSIsSandboxKey];
  if ([apnsTokenData isKindOfClass:[NSData class]] &&
      [apnsSandboxValue isKindOfClass:[NSNumber class]]) {
    NSString *APNSString = FIRInstanceIDAPNSTupleStringForTokenAndServerType(
        apnsTokenData, ((NSNumber *)apnsSandboxValue).boolValue);
    // The name of the query item happens to be the same as the dictionary key
    FIRInstanceIDURLQueryItem *item =
        [FIRInstanceIDURLQueryItem queryItemWithName:kFIRInstanceIDTokenOptionsAPNSKey
                                               value:APNSString];
    [queryItems addObject:item];
  }
  id firebaseAppID = self.options[kFIRInstanceIDTokenOptionsFirebaseAppIDKey];
  if ([firebaseAppID isKindOfClass:[NSString class]]) {
    // The name of the query item happens to be the same as the dictionary key
    FIRInstanceIDURLQueryItem *item =
        [FIRInstanceIDURLQueryItem queryItemWithName:kFIRInstanceIDTokenOptionsFirebaseAppIDKey
                                               value:(NSString *)firebaseAppID];
    [queryItems addObject:item];
  }

  NSString *content = FIRInstanceIDQueryFromQueryItems(queryItems);
  request.HTTPBody = [content dataUsingEncoding:NSUTF8StringEncoding];
  FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeTokenFetchOperationFetchRequest,
                           @"Register request to %@ content: %@", FIRInstanceIDRegisterServer(),
                           content);

  FIRInstanceID_WEAKIFY(self);
  void (^requestHandler)(NSData *, NSURLResponse *, NSError *) =
      ^(NSData *data, NSURLResponse *response, NSError *error) {
        FIRInstanceID_STRONGIFY(self);
        [self handleResponseWithData:data response:response error:error];
      };

  // Test block
  if (self.testBlock) {
    self.testBlock(request, requestHandler);
    return;
  }

  NSURLSession *session = [FIRInstanceIDTokenOperation sharedURLSession];
  self.dataTask = [session dataTaskWithRequest:request completionHandler:requestHandler];
  [self.dataTask resume];
}

#pragma mark - Request Handling

- (void)handleResponseWithData:(NSData *)data
                      response:(NSURLResponse *)response
                         error:(NSError *)error {
  if (error) {
    FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeTokenFetchOperationRequestError,
                             @"Token fetch HTTP error. Error Code: %ld", (long)error.code);
    [self finishWithResult:FIRInstanceIDTokenOperationError token:nil error:error];
    return;
  }
  NSString *dataResponse = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];

  if (dataResponse.length == 0) {
    NSError *error = [NSError errorWithFIRInstanceIDErrorCode:kFIRInstanceIDErrorCodeUnknown];
    [self finishWithResult:FIRInstanceIDTokenOperationError token:nil error:error];
    return;
  }
  NSDictionary *parsedResponse = [self parseFetchTokenResponse:dataResponse];

  if ([parsedResponse[@"token"] length]) {
    [self finishWithResult:FIRInstanceIDTokenOperationSucceeded
                     token:parsedResponse[@"token"]
                     error:nil];
    return;
  }

  NSString *errorValue = parsedResponse[@"Error"];
  NSError *responseError;
  if (errorValue.length) {
    NSArray *errorComponents = [errorValue componentsSeparatedByString:@":"];
    // HACK (Kansas replication delay), PHONE_REGISTRATION_ERROR on App
    // uninstall and reinstall.
    if ([errorComponents containsObject:@"PHONE_REGISTRATION_ERROR"]) {
      // Encountered issue http://b/27043795
      // Retry register until successful or another error encountered or a
      // certain number of tries are over.

      if (phoneRegistrationErrorRetryCount < kMaxPhoneRegistrationErrorRetryCount) {
        const int nextRetryInterval = 1 << phoneRegistrationErrorRetryCount;
        FIRInstanceID_WEAKIFY(self);

        dispatch_after(
            dispatch_time(DISPATCH_TIME_NOW, (int64_t)(nextRetryInterval * NSEC_PER_SEC)),
            dispatch_get_main_queue(), ^{
              FIRInstanceID_STRONGIFY(self);
              phoneRegistrationErrorRetryCount++;
              [self performTokenOperation];
            });
        return;
      }
    } else if ([errorComponents containsObject:kFIRInstanceID_CMD_RST]) {
      // Server detected the identity we use is no longer valid.
      NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
      [center postNotificationName:kFIRInstanceIDIdentityInvalidatedNotification object:nil];

      FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeInternal001,
                               @"Identity is invalid. Server request identity reset.");
      responseError =
          [NSError errorWithFIRInstanceIDErrorCode:kFIRInstanceIDErrorCodeInvalidIdentity];
    }
  }
  if (!responseError) {
    FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeTokenFetchOperationBadResponse,
                             @"Invalid fetch response, expected 'token' or 'Error' key");
    responseError = [NSError errorWithFIRInstanceIDErrorCode:kFIRInstanceIDErrorCodeUnknown];
  }
  [self finishWithResult:FIRInstanceIDTokenOperationError token:nil error:responseError];
}

// expect a response e.g. "token=<reg id>\nGOOG.ttl=123"
- (NSDictionary *)parseFetchTokenResponse:(NSString *)response {
  NSArray *lines = [response componentsSeparatedByString:@"\n"];
  NSMutableDictionary *parsedResponse = [NSMutableDictionary dictionary];
  for (NSString *line in lines) {
    NSArray *keyAndValue = [line componentsSeparatedByString:@"="];
    if ([keyAndValue count] > 1) {
      parsedResponse[keyAndValue[0]] = keyAndValue[1];
    }
  }
  return parsedResponse;
}

@end
