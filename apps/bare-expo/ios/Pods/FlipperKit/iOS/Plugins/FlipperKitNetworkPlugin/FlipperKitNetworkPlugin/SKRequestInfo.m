/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "SKRequestInfo.h"

@implementation SKRequestInfo
@synthesize identifier = _identifier;
@synthesize timestamp = _timestamp;
@synthesize request = _request;
@synthesize body = _body;

- (instancetype)initWithIdentifier:(int64_t)identifier
                         timestamp:(uint64_t)timestamp
                           request:(NSURLRequest*)request
                              data:(NSData*)data {
  if (self = [super init]) {
    _identifier = identifier;
    _timestamp = timestamp;
    _request = request;
    _body = data ? [data base64EncodedStringWithOptions:0]
                 : [request.HTTPBody base64EncodedStringWithOptions:0];
  }
  return self;
}

- (void)setBodyFromData:(NSData* _Nullable)data {
  self.body = data ? [data base64EncodedStringWithOptions:0]
                   : [self.request.HTTPBody base64EncodedStringWithOptions:0];
}

@end
