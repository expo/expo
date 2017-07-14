/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTPackagerClient.h"

#import <ReactABI19_0_0/ABI19_0_0RCTLog.h>
#import <ReactABI19_0_0/ABI19_0_0RCTSRWebSocket.h>
#import <ReactABI19_0_0/ABI19_0_0RCTUtils.h>

#if ABI19_0_0RCT_DEV // Only supported in dev mode

const int ABI19_0_0RCT_PACKAGER_CLIENT_PROTOCOL_VERSION = 2;

@implementation ABI19_0_0RCTPackagerClientResponder {
  id _msgId;
  __weak ABI19_0_0RCTSRWebSocket *_socket;
}

- (instancetype)initWithId:(id)msgId socket:(ABI19_0_0RCTSRWebSocket *)socket
{
  if (self = [super init]) {
    _msgId = msgId;
    _socket = socket;
  }
  return self;
}

- (void)respondWithResult:(id)result
{
  NSDictionary<NSString *, id> *msg = @{
                                        @"version": @(ABI19_0_0RCT_PACKAGER_CLIENT_PROTOCOL_VERSION),
                                        @"id": _msgId,
                                        @"result": result,
                                        };
  NSError *jsError = nil;
  NSString *message = ABI19_0_0RCTJSONStringify(msg, &jsError);
  if (jsError) {
    ABI19_0_0RCTLogError(@"%@ failed to stringify message with error %@", [self class], jsError);
  } else {
    [_socket send:message];
  }
}

- (void)respondWithError:(id)error
{
  NSDictionary<NSString *, id> *msg = @{
                                        @"version": @(ABI19_0_0RCT_PACKAGER_CLIENT_PROTOCOL_VERSION),
                                        @"id": _msgId,
                                        @"error": error,
                                        };
  NSError *jsError = nil;
  NSString *message = ABI19_0_0RCTJSONStringify(msg, &jsError);
  if (jsError) {
    ABI19_0_0RCTLogError(@"%@ failed to stringify message with error %@", [self class], jsError);
  } else {
    [_socket send:message];
  }
}
@end

#endif
