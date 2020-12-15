/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "SKResponseInfo.h"

@implementation SKResponseInfo
@synthesize identifier = _identifier;
@synthesize timestamp = _timestamp;
@synthesize response = _response;
@synthesize body = _body;

- (instancetype)initWithIndentifier:(int64_t)identifier
                          timestamp:(uint64_t)timestamp
                           response:(NSURLResponse*)response
                               data:(NSData*)data {
  if (self = [super init]) {
    _identifier = identifier;
    _timestamp = timestamp;
    _response = response;
    _body = [SKResponseInfo shouldStripReponseBodyWithResponse:response]
        ? nil
        : [data base64EncodedStringWithOptions:0];
  }
  return self;
}

+ (BOOL)shouldStripReponseBodyWithResponse:(NSURLResponse*)response {
  // Only HTTP(S) responses have Content-Type headers
  if (![response isKindOfClass:[NSHTTPURLResponse class]]) {
    return YES;
  }

  NSHTTPURLResponse* httpResponse = (NSHTTPURLResponse*)response;
  NSString* contentType = httpResponse.allHeaderFields[@"content-type"];
  if (!contentType) {
    return NO;
  }

  return [contentType containsString:@"video/"] ||
      [contentType containsString:@"application/zip"];
}

- (void)setBodyFromData:(NSData* _Nullable)data {
  self.body = [SKResponseInfo shouldStripReponseBodyWithResponse:self.response]
      ? nil
      : [data base64EncodedStringWithOptions:0];
}

@end
