/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI26_0_0/ABI26_0_0RCTEventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI26_0_0RCTWebSocketContentHandler <NSObject>

- (id)processMessage:(id __nullable)message forSocketID:(NSNumber *)socketID
            withType:(NSString *__nonnull __autoreleasing *__nonnull)type;

@end

@interface ABI26_0_0RCTWebSocketModule : ABI26_0_0RCTEventEmitter

// Register a custom handler for a specific websocket. The handler will be strongly held by the WebSocketModule.
- (void)setContentHandler:(id<ABI26_0_0RCTWebSocketContentHandler> __nullable)handler forSocketID:(NSNumber *)socketID;

- (void)sendData:(NSData *)data forSocketID:(nonnull NSNumber *)socketID;

@end

@interface ABI26_0_0RCTBridge (ABI26_0_0RCTWebSocketModule)

- (ABI26_0_0RCTWebSocketModule *)webSocketModule;

@end

NS_ASSUME_NONNULL_END
