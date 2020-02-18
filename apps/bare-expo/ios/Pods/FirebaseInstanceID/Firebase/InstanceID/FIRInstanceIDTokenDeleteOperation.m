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

#import "FIRInstanceIDTokenDeleteOperation.h"

#import "FIRInstanceIDCheckinPreferences.h"
#import "FIRInstanceIDDefines.h"
#import "FIRInstanceIDLogger.h"
#import "FIRInstanceIDTokenOperation+Private.h"
#import "FIRInstanceIDURLQueryItem.h"
#import "FIRInstanceIDUtilities.h"
#import "NSError+FIRInstanceID.h"

@implementation FIRInstanceIDTokenDeleteOperation

- (instancetype)initWithAuthorizedEntity:(NSString *)authorizedEntity
                                   scope:(NSString *)scope
                      checkinPreferences:(FIRInstanceIDCheckinPreferences *)checkinPreferences
                                 keyPair:(FIRInstanceIDKeyPair *)keyPair
                                  action:(FIRInstanceIDTokenAction)action {
  self = [super initWithAction:action
           forAuthorizedEntity:authorizedEntity
                         scope:scope
                       options:nil
            checkinPreferences:checkinPreferences
                       keyPair:keyPair];
  if (self) {
  }
  return self;
}

- (void)performTokenOperation {
  NSString *authHeader =
      [FIRInstanceIDTokenOperation HTTPAuthHeaderFromCheckin:self.checkinPreferences];
  NSMutableURLRequest *request = [FIRInstanceIDTokenOperation requestWithAuthHeader:authHeader];

  // Build form-encoded body
  NSString *deviceAuthID = self.checkinPreferences.deviceID;
  NSMutableArray<FIRInstanceIDURLQueryItem *> *queryItems =
      [FIRInstanceIDTokenOperation standardQueryItemsWithDeviceID:deviceAuthID scope:self.scope];
  [queryItems addObject:[FIRInstanceIDURLQueryItem queryItemWithName:@"delete" value:@"true"]];
  if (self.action == FIRInstanceIDTokenActionDeleteTokenAndIID) {
    [queryItems addObject:[FIRInstanceIDURLQueryItem queryItemWithName:@"iid-operation"
                                                                 value:@"delete"]];
  }
  if (self.authorizedEntity) {
    [queryItems addObject:[FIRInstanceIDURLQueryItem queryItemWithName:@"sender"
                                                                 value:self.authorizedEntity]];
  }
  // Typically we include our public key-signed url items, but in some cases (like deleting all FCM
  // tokens), we don't.
  if (self.keyPair != nil) {
    [queryItems addObjectsFromArray:[self queryItemsWithKeyPair:self.keyPair]];
  }

  NSString *content = FIRInstanceIDQueryFromQueryItems(queryItems);
  request.HTTPBody = [content dataUsingEncoding:NSUTF8StringEncoding];
  FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeTokenDeleteOperationFetchRequest,
                           @"Unregister request to %@ content: %@", FIRInstanceIDRegisterServer(),
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

- (void)handleResponseWithData:(NSData *)data
                      response:(NSURLResponse *)response
                         error:(NSError *)error {
  if (error) {
    FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeTokenDeleteOperationRequestError,
                             @"Device unregister HTTP fetch error. Error code: %ld",
                             _FIRInstanceID_L(error.code));
    [self finishWithResult:FIRInstanceIDTokenOperationError token:nil error:error];
    return;
  }

  NSString *dataResponse = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  if (dataResponse.length == 0) {
    NSError *error = [NSError errorWithFIRInstanceIDErrorCode:kFIRInstanceIDErrorCodeUnknown];
    [self finishWithResult:FIRInstanceIDTokenOperationError token:nil error:error];
    return;
  }

  if (![dataResponse hasPrefix:@"deleted="] && ![dataResponse hasPrefix:@"token="]) {
    FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeTokenDeleteOperationBadResponse,
                             @"Invalid unregister response %@", response);
    NSError *error = [NSError errorWithFIRInstanceIDErrorCode:kFIRInstanceIDErrorCodeUnknown];
    [self finishWithResult:FIRInstanceIDTokenOperationError token:nil error:error];
    return;
  }
  [self finishWithResult:FIRInstanceIDTokenOperationSucceeded token:nil error:nil];
}
@end
