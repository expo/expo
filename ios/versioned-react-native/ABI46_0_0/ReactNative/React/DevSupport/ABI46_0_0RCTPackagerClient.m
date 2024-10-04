/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTPackagerClient.h>

#import <ABI46_0_0React/ABI46_0_0RCTLog.h>
#import <ABI46_0_0React/ABI46_0_0RCTReconnectingWebSocket.h>
#import <ABI46_0_0React/ABI46_0_0RCTUtils.h>

#if ABI46_0_0RCT_DEV // Only supported in dev mode

const int ABI46_0_0RCT_PACKAGER_CLIENT_PROTOCOL_VERSION = 2;

@implementation ABI46_0_0RCTPackagerClientResponder {
  id _msgId;
  __weak ABI46_0_0RCTReconnectingWebSocket *_socket;
}

- (instancetype)initWithId:(id)msgId socket:(ABI46_0_0RCTReconnectingWebSocket *)socket
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
    @"version" : @(ABI46_0_0RCT_PACKAGER_CLIENT_PROTOCOL_VERSION),
    @"id" : _msgId,
    @"result" : result,
  };
  NSError *jsError = nil;
  NSString *message = ABI46_0_0RCTJSONStringify(msg, &jsError);
  if (jsError) {
    ABI46_0_0RCTLogError(@"%@ failed to stringify message with error %@", [self class], jsError);
  } else {
    [_socket send:message];
  }
}

- (void)respondWithError:(id)error
{
  NSDictionary<NSString *, id> *msg = @{
    @"version" : @(ABI46_0_0RCT_PACKAGER_CLIENT_PROTOCOL_VERSION),
    @"id" : _msgId,
    @"error" : error,
  };
  NSError *jsError = nil;
  NSString *message = ABI46_0_0RCTJSONStringify(msg, &jsError);
  if (jsError) {
    ABI46_0_0RCTLogError(@"%@ failed to stringify message with error %@", [self class], jsError);
  } else {
    [_socket send:message];
  }
}
@end

#endif
