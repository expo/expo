//
//   Copyright 2012 Square Inc.
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//

#import <Foundation/Foundation.h>
#import <Security/SecCertificate.h>

typedef NS_ENUM(unsigned int, ABI28_0_0RCTSRReadyState) {
    ABI28_0_0RCTSR_CONNECTING   = 0,
    ABI28_0_0RCTSR_OPEN         = 1,
    ABI28_0_0RCTSR_CLOSING      = 2,
    ABI28_0_0RCTSR_CLOSED       = 3,
};

typedef NS_ENUM(NSInteger, ABI28_0_0RCTSRStatusCode) {
    ABI28_0_0RCTSRStatusCodeNormal = 1000,
    ABI28_0_0RCTSRStatusCodeGoingAway = 1001,
    ABI28_0_0RCTSRStatusCodeProtocolError = 1002,
    ABI28_0_0RCTSRStatusCodeUnhandledType = 1003,
    // 1004 reserved.
    ABI28_0_0RCTSRStatusNoStatusReceived = 1005,
    // 1004-1006 reserved.
    ABI28_0_0RCTSRStatusCodeInvalidUTF8 = 1007,
    ABI28_0_0RCTSRStatusCodePolicyViolated = 1008,
    ABI28_0_0RCTSRStatusCodeMessageTooBig = 1009,
};

@class ABI28_0_0RCTSRWebSocket;

extern NSString *const ABI28_0_0RCTSRWebSocketErrorDomain;
extern NSString *const ABI28_0_0RCTSRHTTPResponseErrorKey;

#pragma mark - ABI28_0_0RCTSRWebSocketDelegate

@protocol ABI28_0_0RCTSRWebSocketDelegate;

#pragma mark - ABI28_0_0RCTSRWebSocket

@interface ABI28_0_0RCTSRWebSocket : NSObject <NSStreamDelegate>

@property (nonatomic, weak) id<ABI28_0_0RCTSRWebSocketDelegate> delegate;

@property (nonatomic, readonly) ABI28_0_0RCTSRReadyState readyState;
@property (nonatomic, readonly, strong) NSURL *url;

// This returns the negotiated protocol.
// It will be nil until after the handshake completes.
@property (nonatomic, readonly, copy) NSString *protocol;

// Protocols should be an array of strings that turn into Sec-WebSocket-Protocol.
- (instancetype)initWithURLRequest:(NSURLRequest *)request protocols:(NSArray<NSString *> *)protocols NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithURLRequest:(NSURLRequest *)request;

// Some helper constructors.
- (instancetype)initWithURL:(NSURL *)url protocols:(NSArray<NSString *> *)protocols;
- (instancetype)initWithURL:(NSURL *)url;

// Delegate queue will be dispatch_main_queue by default.
// You cannot set both OperationQueue and dispatch_queue.
- (void)setDelegateOperationQueue:(NSOperationQueue *)queue;
- (void)setDelegateDispatchQueue:(dispatch_queue_t)queue;

// By default, it will schedule itself on +[NSRunLoop ABI28_0_0RCTSR_networkRunLoop] using defaultModes.
- (void)scheduleInRunLoop:(NSRunLoop *)aRunLoop forMode:(NSString *)mode;
- (void)unscheduleFromRunLoop:(NSRunLoop *)aRunLoop forMode:(NSString *)mode;

// ABI28_0_0RCTSRWebSockets are intended for one-time-use only.  Open should be called once and only once.
- (void)open;

- (void)close;
- (void)closeWithCode:(NSInteger)code reason:(NSString *)reason;

// Send a UTF8 String or Data.
- (void)send:(id)data;

// Send Data (can be nil) in a ping message.
- (void)sendPing:(NSData *)data;

@end

#pragma mark - ABI28_0_0RCTSRWebSocketDelegate

@protocol ABI28_0_0RCTSRWebSocketDelegate <NSObject>

// message will either be an NSString if the server is using text
// or NSData if the server is using binary.
- (void)webSocket:(ABI28_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message;

@optional

- (void)webSocketDidOpen:(ABI28_0_0RCTSRWebSocket *)webSocket;
- (void)webSocket:(ABI28_0_0RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error;
- (void)webSocket:(ABI28_0_0RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean;
- (void)webSocket:(ABI28_0_0RCTSRWebSocket *)webSocket didReceivePong:(NSData *)pongPayload;

@end

#pragma mark - NSURLRequest (CertificateAdditions)

@interface NSURLRequest (CertificateAdditions)

@property (nonatomic, readonly, copy) NSArray *ABI28_0_0RCTSR_SSLPinnedCertificates;

@end

#pragma mark - NSMutableURLRequest (CertificateAdditions)

@interface NSMutableURLRequest (CertificateAdditions)

@property (nonatomic, copy) NSArray *ABI28_0_0RCTSR_SSLPinnedCertificates;

@end

#pragma mark - NSRunLoop (ABI28_0_0RCTSRWebSocket)

@interface NSRunLoop (ABI28_0_0RCTSRWebSocket)

+ (NSRunLoop *)ABI28_0_0RCTSR_networkRunLoop;

@end
