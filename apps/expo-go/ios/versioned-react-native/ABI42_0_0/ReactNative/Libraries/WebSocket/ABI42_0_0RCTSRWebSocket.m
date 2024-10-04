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

#import <ABI42_0_0React/ABI42_0_0RCTSRWebSocket.h>

#import <Availability.h>

#import <Security/SecRandom.h>

#import <CommonCrypto/CommonDigest.h>
#import <ABI42_0_0React/ABI42_0_0RCTAssert.h>
#import <ABI42_0_0React/ABI42_0_0RCTLog.h>

typedef NS_ENUM(NSInteger, ABI42_0_0RCTSROpCode)  {
  ABI42_0_0RCTSROpCodeTextFrame = 0x1,
  ABI42_0_0RCTSROpCodeBinaryFrame = 0x2,
  // 3-7 reserved.
  ABI42_0_0RCTSROpCodeConnectionClose = 0x8,
  ABI42_0_0RCTSROpCodePing = 0x9,
  ABI42_0_0RCTSROpCodePong = 0xA,
  // B-F reserved.
};

typedef struct {
  BOOL fin;
  //  BOOL rsv1;
  //  BOOL rsv2;
  //  BOOL rsv3;
  uint8_t opcode;
  BOOL masked;
  uint64_t payload_length;
} frame_header;

static NSString *const ABI42_0_0RCTSRWebSocketAppendToSecKeyString = @"258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

//#define ABI42_0_0RCTSR_ENABLE_LOG
#ifdef ABI42_0_0RCTSR_ENABLE_LOG
#define ABI42_0_0RCTSRLog(format...) ABI42_0_0RCTLogInfo(format)
#else
#define ABI42_0_0RCTSRLog(...) do { } while (0)
#endif

// This is a hack, and probably not optimal
static inline int32_t validate_dispatch_data_partial_string(NSData *data)
{
  static const int maxCodepointSize = 3;

  for (int i = 0; i < maxCodepointSize; i++) {
    NSString *str = [[NSString alloc] initWithBytesNoCopy:(char *)data.bytes length:data.length - i encoding:NSUTF8StringEncoding freeWhenDone:NO];
    if (str) {
      return (int32_t)data.length - i;
    }
  }

  return -1;
}

@interface NSData (ABI42_0_0RCTSRWebSocket)

@property (nonatomic, readonly, copy) NSString *stringBySHA1ThenBase64Encoding;

@end


@interface NSString (ABI42_0_0RCTSRWebSocket)

@property (nonatomic, readonly, copy) NSString *stringBySHA1ThenBase64Encoding;

@end


@interface NSURL (ABI42_0_0RCTSRWebSocket)

// The origin isn't really applicable for a native application.
// So instead, just map ws -> http and wss -> https.
@property (nonatomic, readonly, copy) NSString *ABI42_0_0RCTSR_origin;

@end


@interface _ABI42_0_0RCTSRRunLoopThread : NSThread

@property (nonatomic, readonly) NSRunLoop *runLoop;

@end


static NSString *newSHA1String(const char *bytes, size_t length)
{
  uint8_t md[CC_SHA1_DIGEST_LENGTH];

  assert(length >= 0);
  assert(length <= UINT32_MAX);
  CC_SHA1(bytes, (CC_LONG)length, md);

  NSData *data = [NSData dataWithBytes:md length:CC_SHA1_DIGEST_LENGTH];
  return [data base64EncodedStringWithOptions:0];
}

@implementation NSData (ABI42_0_0RCTSRWebSocket)

- (NSString *)stringBySHA1ThenBase64Encoding
{
  return newSHA1String(self.bytes, self.length);
}

@end


@implementation NSString (ABI42_0_0RCTSRWebSocket)

- (NSString *)stringBySHA1ThenBase64Encoding
{
  return newSHA1String(self.UTF8String, self.length);
}

@end

NSString *const ABI42_0_0RCTSRWebSocketErrorDomain = @"ABI42_0_0RCTSRWebSocketErrorDomain";
NSString *const ABI42_0_0RCTSRHTTPResponseErrorKey = @"HTTPResponseStatusCode";

// Returns number of bytes consumed. Returning 0 means you didn't match.
// Sends bytes to callback handler;
typedef size_t (^stream_scanner)(NSData *collected_data);

typedef void (^data_callback)(ABI42_0_0RCTSRWebSocket *webSocket,  NSData *data);

@interface ABI42_0_0RCTSRIOConsumer : NSObject

@property (nonatomic, copy, readonly) stream_scanner consumer;
@property (nonatomic, copy, readonly) data_callback handler;
@property (nonatomic, assign) size_t bytesNeeded;
@property (nonatomic, assign, readonly) BOOL readToCurrentFrame;
@property (nonatomic, assign, readonly) BOOL unmaskBytes;

@end

// This class is not thread-safe, and is expected to always be run on the same queue.
@interface ABI42_0_0RCTSRIOConsumerPool : NSObject

- (instancetype)initWithBufferCapacity:(NSUInteger)poolSize NS_DESIGNATED_INITIALIZER;

- (ABI42_0_0RCTSRIOConsumer *)consumerWithScanner:(stream_scanner)scanner handler:(data_callback)handler bytesNeeded:(size_t)bytesNeeded readToCurrentFrame:(BOOL)readToCurrentFrame unmaskBytes:(BOOL)unmaskBytes;
- (void)returnConsumer:(ABI42_0_0RCTSRIOConsumer *)consumer;

@end

@interface ABI42_0_0RCTSRWebSocket ()  <NSStreamDelegate>

@property (nonatomic, assign) ABI42_0_0RCTSRReadyState readyState;

@property (nonatomic, strong) NSOperationQueue *delegateOperationQueue;
@property (nonatomic, strong) dispatch_queue_t delegateDispatchQueue;

@end

@implementation ABI42_0_0RCTSRWebSocket
{
  NSInteger _webSocketVersion;

  NSOperationQueue *_delegateOperationQueue;
  dispatch_queue_t _delegateDispatchQueue;

  dispatch_queue_t _workQueue;
  NSMutableArray<ABI42_0_0RCTSRIOConsumer *> *_consumers;

  NSInputStream *_inputStream;
  NSOutputStream *_outputStream;

  NSMutableData *_readBuffer;
  NSUInteger _readBufferOffset;

  NSMutableData *_outputBuffer;
  NSUInteger _outputBufferOffset;

  uint8_t _currentFrameOpcode;
  size_t _currentFrameCount;
  size_t _readOpCount;
  uint32_t _currentStringScanPosition;
  NSMutableData *_currentFrameData;

  NSString *_closeReason;

  NSString *_secKey;

  BOOL _pinnedCertFound;

  uint8_t _currentReadMaskKey[4];
  size_t _currentReadMaskOffset;

  BOOL _consumerStopped;

  BOOL _closeWhenFinishedWriting;
  BOOL _failed;

  BOOL _secure;
  NSURLRequest *_urlRequest;

  CFHTTPMessageRef _receivedHTTPHeaders;

  BOOL _sentClose;
  BOOL _didFail;
  int _closeCode;

  BOOL _isPumping;
  
  BOOL _cleanupScheduled;

  NSMutableSet<NSArray *> *_scheduledRunloops;

  // We use this to retain ourselves.
  __strong ABI42_0_0RCTSRWebSocket *_selfRetain;

  NSArray<NSString *> *_requestedProtocols;
  ABI42_0_0RCTSRIOConsumerPool *_consumerPool;
}

- (instancetype)initWithURLRequest:(NSURLRequest *)request protocols:(NSArray<NSString *> *)protocols
{
  ABI42_0_0RCTAssertParam(request);

  if ((self = [super init])) {
    _url = request.URL;
    _urlRequest = request;

    _requestedProtocols = [protocols copy];

    [self _ABI42_0_0RCTSR_commonInit];
  }
  return self;
}

ABI42_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (instancetype)initWithURLRequest:(NSURLRequest *)request
{
  return [self initWithURLRequest:request protocols:nil];
}

- (instancetype)initWithURL:(NSURL *)URL
{
  return [self initWithURL:URL protocols:nil];
}

- (instancetype)initWithURL:(NSURL *)URL protocols:(NSArray<NSString *> *)protocols
{
  NSMutableURLRequest *request;
  if (URL) {
    // Build a mutable request so we can fill the cookie header.
    request = [NSMutableURLRequest requestWithURL:URL];

    // We load cookies from sharedHTTPCookieStorage (shared with XHR and
    // fetch). To get HTTPS-only cookies for wss URLs, replace wss with https
    // in the URL.
    NSURLComponents *components = [NSURLComponents componentsWithURL:URL resolvingAgainstBaseURL:true];
    if ([components.scheme isEqualToString:@"wss"]) {
      components.scheme = @"https";
    }

    // Load and set the cookie header.
    NSArray<NSHTTPCookie *> *cookies = [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookiesForURL:components.URL];
    [request setAllHTTPHeaderFields:[NSHTTPCookie requestHeaderFieldsWithCookies:cookies]];
  }
  return [self initWithURLRequest:request protocols:protocols];
}

- (void)_ABI42_0_0RCTSR_commonInit
{
  NSString *scheme = _url.scheme.lowercaseString;
  assert([scheme isEqualToString:@"ws"] || [scheme isEqualToString:@"http"] || [scheme isEqualToString:@"wss"] || [scheme isEqualToString:@"https"]);

  if ([scheme isEqualToString:@"wss"] || [scheme isEqualToString:@"https"]) {
    _secure = YES;
  }

  _readyState = ABI42_0_0RCTSR_CONNECTING;
  _consumerStopped = YES;
  _webSocketVersion = 13;

  _workQueue = dispatch_queue_create("com.facebook.ABI42_0_0React.SRWebSocket", DISPATCH_QUEUE_SERIAL);

  // Going to set a specific on the queue so we can validate we're on the work queue
  dispatch_queue_set_specific(_workQueue, (__bridge void *)self, (__bridge void *)_workQueue, NULL);

  _delegateDispatchQueue = dispatch_get_main_queue();

  _readBuffer = [NSMutableData new];
  _outputBuffer = [NSMutableData new];

  _currentFrameData = [NSMutableData new];

  _consumers = [NSMutableArray new];

  _consumerPool = [ABI42_0_0RCTSRIOConsumerPool new];

  _scheduledRunloops = [NSMutableSet new];

  [self _initializeStreams];

  // default handlers
}

- (void)assertOnWorkQueue
{
  assert(dispatch_get_specific((__bridge void *)self) == (__bridge void *)_workQueue);
}

- (void)dealloc
{
  _inputStream.delegate = nil;
  _outputStream.delegate = nil;

  [_inputStream close];
  [_outputStream close];
  
  if (_receivedHTTPHeaders) {
    CFRelease(_receivedHTTPHeaders);
    _receivedHTTPHeaders = NULL;
  }
}

#ifndef NDEBUG

- (void)setReadyState:(ABI42_0_0RCTSRReadyState)aReadyState
{
  [self willChangeValueForKey:@"readyState"];
  assert(aReadyState > _readyState);
  _readyState = aReadyState;
  [self didChangeValueForKey:@"readyState"];
}

#endif

- (void)open
{
  assert(_url);
  ABI42_0_0RCTAssert(_readyState == ABI42_0_0RCTSR_CONNECTING, @"Cannot call -(void)open on ABI42_0_0RCTSRWebSocket more than once");

  _selfRetain = self;

  [self _connect];
}

// Calls block on delegate queue
- (void)_performDelegateBlock:(dispatch_block_t)block
{
  if (_delegateOperationQueue) {
    [_delegateOperationQueue addOperationWithBlock:block];
  } else {
    assert(_delegateDispatchQueue);
    dispatch_async(_delegateDispatchQueue, block);
  }
}

- (void)setDelegateDispatchQueue:(dispatch_queue_t)queue
{
  _delegateDispatchQueue = queue;
}

- (BOOL)_checkHandshake:(CFHTTPMessageRef)httpMessage
{
  NSString *acceptHeader = CFBridgingRelease(CFHTTPMessageCopyHeaderFieldValue(httpMessage, CFSTR("Sec-WebSocket-Accept")));

  if (acceptHeader == nil) {
    return NO;
  }

  NSString *concattedString = [_secKey stringByAppendingString:ABI42_0_0RCTSRWebSocketAppendToSecKeyString];
  NSString *expectedAccept = [concattedString stringBySHA1ThenBase64Encoding];

  return [acceptHeader isEqualToString:expectedAccept];
}

- (void)_HTTPHeadersDidFinish
{
  NSInteger responseCode = CFHTTPMessageGetResponseStatusCode(_receivedHTTPHeaders);

  if (responseCode >= 400) {
    ABI42_0_0RCTSRLog(@"Request failed with response code %ld", responseCode);
    [self _failWithError:[NSError errorWithDomain:ABI42_0_0RCTSRWebSocketErrorDomain code:2132 userInfo:@{NSLocalizedDescriptionKey:[NSString stringWithFormat:@"received bad response code from server %ld", (long)responseCode], ABI42_0_0RCTSRHTTPResponseErrorKey:@(responseCode)}]];
    return;
  }

  if (![self _checkHandshake:_receivedHTTPHeaders]) {
    [self _failWithError:[NSError errorWithDomain:ABI42_0_0RCTSRWebSocketErrorDomain code:2133 userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Invalid Sec-WebSocket-Accept response"]}]];
    return;
  }

  NSString *negotiatedProtocol = CFBridgingRelease(CFHTTPMessageCopyHeaderFieldValue(_receivedHTTPHeaders, CFSTR("Sec-WebSocket-Protocol")));
  if (negotiatedProtocol) {
    // Make sure we requested the protocol
    if ([_requestedProtocols indexOfObject:negotiatedProtocol] == NSNotFound) {
      [self _failWithError:[NSError errorWithDomain:ABI42_0_0RCTSRWebSocketErrorDomain code:2133 userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Server specified Sec-WebSocket-Protocol that wasn't requested"]}]];
      return;
    }

    _protocol = negotiatedProtocol;
  }

  self.readyState = ABI42_0_0RCTSR_OPEN;

  if (!_didFail) {
    [self _readFrameNew];
  }

  [self _performDelegateBlock:^{
    if ([self.delegate respondsToSelector:@selector(webSocketDidOpen:)]) {
      [self.delegate webSocketDidOpen:self];
    };
  }];
}

- (void)_readHTTPHeader
{
  if (_receivedHTTPHeaders == NULL) {
    _receivedHTTPHeaders = CFHTTPMessageCreateEmpty(NULL, NO);
  }

  [self _readUntilHeaderCompleteWithCallback:^(ABI42_0_0RCTSRWebSocket *socket,  NSData *data) {
    CFHTTPMessageAppendBytes(self->_receivedHTTPHeaders, (const UInt8 *)data.bytes, data.length);

    if (CFHTTPMessageIsHeaderComplete(self->_receivedHTTPHeaders)) {
      ABI42_0_0RCTSRLog(@"Finished reading headers %@", CFBridgingRelease(CFHTTPMessageCopyAllHeaderFields(_receivedHTTPHeaders)));
      [socket _HTTPHeadersDidFinish];
    } else {
      [socket _readHTTPHeader];
    }
  }];
}

- (void)didConnect
{
  ABI42_0_0RCTSRLog(@"Connected");
  CFHTTPMessageRef request = CFHTTPMessageCreateRequest(NULL, CFSTR("GET"), (__bridge CFURLRef)_url, kCFHTTPVersion1_1);

  // Set host first so it defaults
  CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Host"), (__bridge CFStringRef)(_url.port ? [NSString stringWithFormat:@"%@:%@", _url.host, _url.port] : _url.host));

  NSMutableData *keyBytes = [[NSMutableData alloc] initWithLength:16];
  int result __unused = SecRandomCopyBytes(kSecRandomDefault, keyBytes.length, keyBytes.mutableBytes);
  assert(result == 0);
  _secKey = [keyBytes base64EncodedStringWithOptions:0];
  assert([_secKey length] == 24);

  CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Upgrade"), CFSTR("websocket"));
  CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Connection"), CFSTR("Upgrade"));
  CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Sec-WebSocket-Key"), (__bridge CFStringRef)_secKey);
  CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Sec-WebSocket-Version"), (__bridge CFStringRef)[NSString stringWithFormat:@"%ld", (long)_webSocketVersion]);

  CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Origin"), (__bridge CFStringRef)_url.ABI42_0_0RCTSR_origin);

  if (_requestedProtocols) {
    CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Sec-WebSocket-Protocol"), (__bridge CFStringRef)[_requestedProtocols componentsJoinedByString:@", "]);
  }

  [_urlRequest.allHTTPHeaderFields enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
    CFHTTPMessageSetHeaderFieldValue(request, (__bridge CFStringRef)key, (__bridge CFStringRef)obj);
  }];

  NSData *message = CFBridgingRelease(CFHTTPMessageCopySerializedMessage(request));

  CFRelease(request);

  [self _writeData:message];
  [self _readHTTPHeader];
}

- (void)_initializeStreams
{
  assert(_url.port.unsignedIntValue <= UINT32_MAX);
  uint32_t port = _url.port.unsignedIntValue;
  if (port == 0) {
    if (!_secure) {
      port = 80;
    } else {
      port = 443;
    }
  }
  NSString *host = _url.host;

  CFReadStreamRef readStream = NULL;
  CFWriteStreamRef writeStream = NULL;

  CFStreamCreatePairWithSocketToHost(NULL, (__bridge CFStringRef)host, port, &readStream, &writeStream);

  _outputStream = CFBridgingRelease(writeStream);
  _inputStream = CFBridgingRelease(readStream);


  if (_secure) {
    NSMutableDictionary<NSString *, id> *SSLOptions = [NSMutableDictionary new];

    [_outputStream setProperty:(__bridge id)kCFStreamSocketSecurityLevelNegotiatedSSL forKey:(__bridge id)kCFStreamPropertySocketSecurityLevel];

    // If we're using pinned certs, don't validate the certificate chain
    if (_urlRequest.ABI42_0_0RCTSR_SSLPinnedCertificates.count) {
      [SSLOptions setValue:@NO forKey:(__bridge id)kCFStreamSSLValidatesCertificateChain];
    }

#if DEBUG
    [SSLOptions setValue:@NO forKey:(__bridge id)kCFStreamSSLValidatesCertificateChain];
    ABI42_0_0RCTLogInfo(@"SocketRocket: In debug mode.  Allowing connection to any root cert");
#endif

    [_outputStream setProperty:SSLOptions
                        forKey:(__bridge id)kCFStreamPropertySSLSettings];
  }

  _inputStream.delegate = self;
  _outputStream.delegate = self;
}

- (void)_connect
{
  if (!_scheduledRunloops.count) {
    [self scheduleInRunLoop:[NSRunLoop ABI42_0_0RCTSR_networkRunLoop] forMode:NSDefaultRunLoopMode];
  }

  [_outputStream open];
  [_inputStream open];
}

- (void)scheduleInRunLoop:(NSRunLoop *)aRunLoop forMode:(NSString *)mode
{
  [_outputStream scheduleInRunLoop:aRunLoop forMode:mode];
  [_inputStream scheduleInRunLoop:aRunLoop forMode:mode];

  [_scheduledRunloops addObject:@[aRunLoop, mode]];
}

- (void)unscheduleFromRunLoop:(NSRunLoop *)aRunLoop forMode:(NSString *)mode
{
  [_outputStream removeFromRunLoop:aRunLoop forMode:mode];
  [_inputStream removeFromRunLoop:aRunLoop forMode:mode];

  [_scheduledRunloops removeObject:@[aRunLoop, mode]];
}

- (void)close
{
  [self closeWithCode:ABI42_0_0RCTSRStatusCodeNormal reason:nil];
}

- (void)closeWithCode:(NSInteger)code reason:(NSString *)reason
{
  assert(code);
  dispatch_async(_workQueue, ^{
    if (self.readyState == ABI42_0_0RCTSR_CLOSING || self.readyState == ABI42_0_0RCTSR_CLOSED) {
      return;
    }

    BOOL wasConnecting = self.readyState == ABI42_0_0RCTSR_CONNECTING;

    self.readyState = ABI42_0_0RCTSR_CLOSING;

    ABI42_0_0RCTSRLog(@"Closing with code %ld reason %@", code, reason);

    if (wasConnecting) {
      [self _disconnect];
      return;
    }

    size_t maxMsgSize = [reason maximumLengthOfBytesUsingEncoding:NSUTF8StringEncoding];
    NSMutableData *mutablePayload = [[NSMutableData alloc] initWithLength:sizeof(uint16_t) + maxMsgSize];
    NSData *payload = mutablePayload;

    ((uint16_t *)mutablePayload.mutableBytes)[0] = NSSwapBigShortToHost(code);

    if (reason) {
      NSRange remainingRange = {0};

      NSUInteger usedLength = 0;

      BOOL success __unused = [reason getBytes:(char *)mutablePayload.mutableBytes + sizeof(uint16_t) maxLength:payload.length - sizeof(uint16_t) usedLength:&usedLength encoding:NSUTF8StringEncoding options:NSStringEncodingConversionExternalRepresentation range:NSMakeRange(0, reason.length) remainingRange:&remainingRange];

      assert(success);
      assert(remainingRange.length == 0);

      if (usedLength != maxMsgSize) {
        payload = [payload subdataWithRange:NSMakeRange(0, usedLength + sizeof(uint16_t))];
      }
    }

    [self _sendFrameWithOpcode:ABI42_0_0RCTSROpCodeConnectionClose data:payload];
  });
}

- (void)_closeWithProtocolError:(NSString *)message
{
  // Need to shunt this on the _callbackQueue first to see if they received any messages
  [self _performDelegateBlock:^{
    [self closeWithCode:ABI42_0_0RCTSRStatusCodeProtocolError reason:message];
    dispatch_async(self->_workQueue, ^{
      [self _disconnect];
    });
  }];
}

- (void)_failWithError:(NSError *)error
{
  dispatch_async(_workQueue, ^{
    if (self.readyState != ABI42_0_0RCTSR_CLOSED) {
      self->_failed = YES;
      [self _performDelegateBlock:^{
        if ([self.delegate respondsToSelector:@selector(webSocket:didFailWithError:)]) {
          [self.delegate webSocket:self didFailWithError:error];
        }
      }];

      self.readyState = ABI42_0_0RCTSR_CLOSED;
      
      ABI42_0_0RCTSRLog(@"Failing with error %@", error.localizedDescription);

      [self _disconnect];
      [self _scheduleCleanup];
    }
  });
}

- (void)_writeData:(NSData *)data
{
  [self assertOnWorkQueue];

  if (_closeWhenFinishedWriting) {
    return;
  }
  [_outputBuffer appendData:data];
  [self _pumpWriting];
}

- (void)send:(id)data
{
  ABI42_0_0RCTAssert(self.readyState != ABI42_0_0RCTSR_CONNECTING, @"Invalid State: Cannot call send: until connection is open");
  if (nil == data) {
    return;
  }
  // TODO: maybe not copy this for performance
  data = [data copy];
  dispatch_async(_workQueue, ^{
    if ([data isKindOfClass:[NSString class]]) {
      [self _sendFrameWithOpcode:ABI42_0_0RCTSROpCodeTextFrame data:[(NSString *)data dataUsingEncoding:NSUTF8StringEncoding]];
    } else if ([data isKindOfClass:[NSData class]]) {
      [self _sendFrameWithOpcode:ABI42_0_0RCTSROpCodeBinaryFrame data:data];
    } else {
      assert(NO);
    }
  });
}

- (void)sendPing:(NSData *)data
{
  ABI42_0_0RCTAssert(self.readyState == ABI42_0_0RCTSR_OPEN, @"Invalid State: Cannot call send: until connection is open");
  // TODO: maybe not copy this for performance
  data = [data copy] ?: [NSData data]; // It's okay for a ping to be empty
  dispatch_async(_workQueue, ^{
    [self _sendFrameWithOpcode:ABI42_0_0RCTSROpCodePing data:data];
  });
}

- (void)handlePing:(NSData *)pingData
{
  // Need to pingpong this off _callbackQueue first to make sure messages happen in order
  [self _performDelegateBlock:^{
    dispatch_async(self->_workQueue, ^{
      [self _sendFrameWithOpcode:ABI42_0_0RCTSROpCodePong data:pingData];
    });
  }];
}

- (void)handlePong:(NSData *)pongData
{
  ABI42_0_0RCTSRLog(@"Received pong");
  [self _performDelegateBlock:^{
    if ([self.delegate respondsToSelector:@selector(webSocket:didReceivePong:)]) {
      [self.delegate webSocket:self didReceivePong:pongData];
    }
  }];
}

- (void)_handleMessage:(id)message
{
  ABI42_0_0RCTSRLog(@"Received message");
  [self _performDelegateBlock:^{
    [self.delegate webSocket:self didReceiveMessage:message];
  }];
}

static inline BOOL closeCodeIsValid(int closeCode)
{
  if (closeCode < 1000) {
    return NO;
  }

  if (closeCode >= 1000 && closeCode <= 1011) {
    if (closeCode == 1004 ||
        closeCode == 1005 ||
        closeCode == 1006) {
      return NO;
    }
    return YES;
  }

  if (closeCode >= 3000 && closeCode <= 3999) {
    return YES;
  }

  if (closeCode >= 4000 && closeCode <= 4999) {
    return YES;
  }

  return NO;
}

//  Note from RFC:
//
//  If there is a body, the first two
//  bytes of the body MUST be a 2-byte unsigned integer (in network byte
//  order) representing a status code with value /code/ defined in
//  Section 7.4.  Following the 2-byte integer the body MAY contain UTF-8
//  encoded data with value /reason/, the interpretation of which is not
//  defined by this specification.

- (void)handleCloseWithData:(NSData *)data
{
  size_t dataSize = data.length;
  __block uint16_t closeCode = 0;

  ABI42_0_0RCTSRLog(@"Received close frame");

  if (dataSize == 1) {
    // TODO: handle error
    [self _closeWithProtocolError:@"Payload for close must be larger than 2 bytes"];
    return;
  } else if (dataSize >= 2) {
    [data getBytes:&closeCode length:sizeof(closeCode)];
    _closeCode = NSSwapBigShortToHost(closeCode);
    if (!closeCodeIsValid(_closeCode)) {
      [self _closeWithProtocolError:[NSString stringWithFormat:@"Cannot have close code of %d", _closeCode]];
      return;
    }
    if (dataSize > 2) {
      _closeReason = [[NSString alloc] initWithData:[data subdataWithRange:NSMakeRange(2, dataSize - 2)] encoding:NSUTF8StringEncoding];
      if (!_closeReason) {
        [self _closeWithProtocolError:@"Close reason MUST be valid UTF-8"];
        return;
      }
    }
  } else {
    _closeCode = ABI42_0_0RCTSRStatusNoStatusReceived;
  }

  [self assertOnWorkQueue];

  if (self.readyState == ABI42_0_0RCTSR_OPEN) {
    [self closeWithCode:1000 reason:nil];
  }
  dispatch_async(_workQueue, ^{
    [self _disconnect];
  });
}

- (void)_disconnect
{
  [self assertOnWorkQueue];
  ABI42_0_0RCTSRLog(@"Trying to disconnect");
  _closeWhenFinishedWriting = YES;
  [self _pumpWriting];
}

- (void)_handleFrameWithData:(NSData *)frameData opCode:(NSInteger)opcode
{
  // Check that the current data is valid UTF8

  BOOL isControlFrame = (opcode == ABI42_0_0RCTSROpCodePing || opcode == ABI42_0_0RCTSROpCodePong || opcode == ABI42_0_0RCTSROpCodeConnectionClose);
  if (!isControlFrame) {
    [self _readFrameNew];
  } else {
    dispatch_async(_workQueue, ^{
      [self _readFrameContinue];
    });
  }

  switch (opcode) {
    case ABI42_0_0RCTSROpCodeTextFrame: {
      NSString *str = [[NSString alloc] initWithData:frameData encoding:NSUTF8StringEncoding];
      if (str == nil && frameData) {
        [self closeWithCode:ABI42_0_0RCTSRStatusCodeInvalidUTF8 reason:@"Text frames must be valid UTF-8"];
        dispatch_async(_workQueue, ^{
          [self _disconnect];
        });

        return;
      }
      [self _handleMessage:str];
      break;
    }
    case ABI42_0_0RCTSROpCodeBinaryFrame:
      [self _handleMessage:[frameData copy]];
      break;
    case ABI42_0_0RCTSROpCodeConnectionClose:
      [self handleCloseWithData:frameData];
      break;
    case ABI42_0_0RCTSROpCodePing:
      [self handlePing:frameData];
      break;
    case ABI42_0_0RCTSROpCodePong:
      [self handlePong:frameData];
      break;
    default:
      [self _closeWithProtocolError:[NSString stringWithFormat:@"Unknown opcode %ld", (long)opcode]];
      // TODO: Handle invalid opcode
      break;
  }
}

- (void)_handleFrameHeader:(frame_header)frame_header curData:(NSData *)curData
{
  assert(frame_header.opcode != 0);

  if (self.readyState != ABI42_0_0RCTSR_OPEN) {
    return;
  }

  BOOL isControlFrame = (frame_header.opcode == ABI42_0_0RCTSROpCodePing || frame_header.opcode == ABI42_0_0RCTSROpCodePong || frame_header.opcode == ABI42_0_0RCTSROpCodeConnectionClose);

  if (isControlFrame && !frame_header.fin) {
    [self _closeWithProtocolError:@"Fragmented control frames not allowed"];
    return;
  }

  if (isControlFrame && frame_header.payload_length >= 126) {
    [self _closeWithProtocolError:@"Control frames cannot have payloads larger than 126 bytes"];
    return;
  }

  if (!isControlFrame) {
    _currentFrameOpcode = frame_header.opcode;
    _currentFrameCount += 1;
  }

  if (frame_header.payload_length == 0) {
    if (isControlFrame) {
      [self _handleFrameWithData:curData opCode:frame_header.opcode];
    } else {
      if (frame_header.fin) {
        [self _handleFrameWithData:_currentFrameData opCode:frame_header.opcode];
      } else {
        // TODO: add assert that opcode is not a control;
        [self _readFrameContinue];
      }
    }
  } else {
    assert(frame_header.payload_length <= SIZE_T_MAX);
    [self _addConsumerWithDataLength:(size_t)frame_header.payload_length callback:^(ABI42_0_0RCTSRWebSocket *socket, NSData *newData) {
      if (isControlFrame) {
        [socket _handleFrameWithData:newData opCode:frame_header.opcode];
      } else {
        if (frame_header.fin) {
          [socket _handleFrameWithData:socket->_currentFrameData opCode:frame_header.opcode];
        } else {
          // TODO: add assert that opcode is not a control;
          [socket _readFrameContinue];
        }

      }
    } readToCurrentFrame:!isControlFrame unmaskBytes:frame_header.masked];
  }
}

/* From RFC:

 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-------+-+-------------+-------------------------------+
 |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
 |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
 |N|V|V|V|       |S|             |   (if payload len==126/127)   |
 | |1|2|3|       |K|             |                               |
 +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
 |     Extended payload length continued, if payload len == 127  |
 + - - - - - - - - - - - - - - - +-------------------------------+
 |                               |Masking-key, if MASK set to 1  |
 +-------------------------------+-------------------------------+
 | Masking-key (continued)       |          Payload Data         |
 +-------------------------------- - - - - - - - - - - - - - - - +
 :                     Payload Data continued ...                :
 + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
 |                     Payload Data continued ...                |
 +---------------------------------------------------------------+
 */

static const uint8_t ABI42_0_0RCTSRFinMask          = 0x80;
static const uint8_t ABI42_0_0RCTSROpCodeMask       = 0x0F;
static const uint8_t ABI42_0_0RCTSRRsvMask          = 0x70;
static const uint8_t ABI42_0_0RCTSRMaskMask         = 0x80;
static const uint8_t ABI42_0_0RCTSRPayloadLenMask   = 0x7F;

- (void)_readFrameContinue
{
  assert((_currentFrameCount == 0 && _currentFrameOpcode == 0) || (_currentFrameCount > 0 && _currentFrameOpcode > 0));

  [self _addConsumerWithDataLength:2 callback:^(ABI42_0_0RCTSRWebSocket *socket, NSData *data) {
    __block frame_header header = {0};

    const uint8_t *headerBuffer = data.bytes;
    assert(data.length >= 2);

    if (headerBuffer[0] & ABI42_0_0RCTSRRsvMask) {
      [socket _closeWithProtocolError:@"Server used RSV bits"];
      return;
    }

    uint8_t receivedOpcode = (ABI42_0_0RCTSROpCodeMask &headerBuffer[0]);

    BOOL isControlFrame = (receivedOpcode == ABI42_0_0RCTSROpCodePing || receivedOpcode == ABI42_0_0RCTSROpCodePong || receivedOpcode == ABI42_0_0RCTSROpCodeConnectionClose);

    if (!isControlFrame && receivedOpcode != 0 && socket->_currentFrameCount > 0) {
      [socket _closeWithProtocolError:@"all data frames after the initial data frame must have opcode 0"];
      return;
    }

    if (receivedOpcode == 0 && socket->_currentFrameCount == 0) {
      [socket _closeWithProtocolError:@"cannot continue a message"];
      return;
    }

    header.opcode = receivedOpcode == 0 ? socket->_currentFrameOpcode : receivedOpcode;

    header.fin = !!(ABI42_0_0RCTSRFinMask &headerBuffer[0]);


    header.masked = !!(ABI42_0_0RCTSRMaskMask &headerBuffer[1]);
    header.payload_length = ABI42_0_0RCTSRPayloadLenMask & headerBuffer[1];

    headerBuffer = NULL;

    if (header.masked) {
      [socket _closeWithProtocolError:@"Client must receive unmasked data"];
    }

    size_t extra_bytes_needed = header.masked ? sizeof(self->_currentReadMaskKey) : 0;

    if (header.payload_length == 126) {
      extra_bytes_needed += sizeof(uint16_t);
    } else if (header.payload_length == 127) {
      extra_bytes_needed += sizeof(uint64_t);
    }

    if (extra_bytes_needed == 0) {
      [socket _handleFrameHeader:header curData:socket->_currentFrameData];
    } else {
      [socket _addConsumerWithDataLength:extra_bytes_needed callback:^(ABI42_0_0RCTSRWebSocket *_socket, NSData *_data) {
        size_t mapped_size __unused = _data.length;
        const void *mapped_buffer = _data.bytes;
        size_t offset = 0;

        if (header.payload_length == 126) {
          assert(mapped_size >= sizeof(uint16_t));
          uint16_t newLen = NSSwapBigShortToHost(*(uint16_t *)(mapped_buffer));
          header.payload_length = newLen;
          offset += sizeof(uint16_t);
        } else if (header.payload_length == 127) {
          assert(mapped_size >= sizeof(uint64_t));
          header.payload_length = NSSwapBigLongLongToHost(*(uint64_t *)(mapped_buffer));
          offset += sizeof(uint64_t);
        } else {
          assert(header.payload_length < 126 && header.payload_length >= 0);
        }

        if (header.masked) {
          assert(mapped_size >= sizeof(self->_currentReadMaskOffset) + offset);
          memcpy(_socket->_currentReadMaskKey, ((uint8_t *)mapped_buffer) + offset, sizeof(_socket->_currentReadMaskKey));
        }

        [_socket _handleFrameHeader:header curData:_socket->_currentFrameData];
      } readToCurrentFrame:NO unmaskBytes:NO];
    }
  } readToCurrentFrame:NO unmaskBytes:NO];
}

- (void)_readFrameNew
{
  dispatch_async(_workQueue, ^{
    self->_currentFrameData.length = 0;

    self->_currentFrameOpcode = 0;
    self->_currentFrameCount = 0;
    self->_readOpCount = 0;
    self->_currentStringScanPosition = 0;

    [self _readFrameContinue];
  });
}

- (void)_pumpWriting
{
  [self assertOnWorkQueue];

  NSUInteger dataLength = _outputBuffer.length;
  if (dataLength - _outputBufferOffset > 0 && _outputStream.hasSpaceAvailable) {
    NSInteger bytesWritten = [_outputStream write:_outputBuffer.bytes + _outputBufferOffset maxLength:dataLength - _outputBufferOffset];
    if (bytesWritten == -1) {
      [self _failWithError:[NSError errorWithDomain:ABI42_0_0RCTSRWebSocketErrorDomain code:2145 userInfo:@{NSLocalizedDescriptionKey: @"Error writing to stream"}]];
      return;
    }

    _outputBufferOffset += bytesWritten;

    if (_outputBufferOffset > 4096 && _outputBufferOffset > (_outputBuffer.length >> 1)) {
      _outputBuffer = [[NSMutableData alloc] initWithBytes:(char *)_outputBuffer.bytes + _outputBufferOffset length:_outputBuffer.length - _outputBufferOffset];
      _outputBufferOffset = 0;
    }
  }

  if (_closeWhenFinishedWriting &&
      _outputBuffer.length - _outputBufferOffset == 0 &&
      (_inputStream.streamStatus != NSStreamStatusNotOpen &&
       _inputStream.streamStatus != NSStreamStatusClosed) &&
      !_sentClose) {
    _sentClose = YES;

    [self _scheduleCleanup];

    if (!_failed) {
      [self _performDelegateBlock:^{
        if ([self.delegate respondsToSelector:@selector(webSocket:didCloseWithCode:reason:wasClean:)]) {
          [self.delegate webSocket:self didCloseWithCode:self->_closeCode reason:self->_closeReason wasClean:YES];
        }
      }];
    }
  }
}

- (void)_addConsumerWithScanner:(stream_scanner)consumer callback:(data_callback)callback
{
  [self assertOnWorkQueue];
  [self _addConsumerWithScanner:consumer callback:callback dataLength:0];
}

- (void)_addConsumerWithDataLength:(size_t)dataLength callback:(data_callback)callback readToCurrentFrame:(BOOL)readToCurrentFrame unmaskBytes:(BOOL)unmaskBytes
{
  [self assertOnWorkQueue];
  assert(dataLength);

  [_consumers addObject:[_consumerPool consumerWithScanner:nil handler:callback bytesNeeded:dataLength readToCurrentFrame:readToCurrentFrame unmaskBytes:unmaskBytes]];
  [self _pumpScanner];
}

- (void)_addConsumerWithScanner:(stream_scanner)consumer callback:(data_callback)callback dataLength:(size_t)dataLength
{
  [self assertOnWorkQueue];
  [_consumers addObject:[_consumerPool consumerWithScanner:consumer handler:callback bytesNeeded:dataLength readToCurrentFrame:NO unmaskBytes:NO]];
  [self _pumpScanner];
}

static const char CRLFCRLFBytes[] = {'\r', '\n', '\r', '\n'};

- (void)_readUntilHeaderCompleteWithCallback:(data_callback)dataHandler
{
  [self _readUntilBytes:CRLFCRLFBytes length:sizeof(CRLFCRLFBytes) callback:dataHandler];
}

- (void)_readUntilBytes:(const void *)bytes length:(size_t)length callback:(data_callback)dataHandler
{
  // TODO: optimize so this can continue from where we last searched
  stream_scanner consumer = ^size_t(NSData *data) {
    __block size_t found_size = 0;
    __block size_t match_count = 0;

    size_t size = data.length;
    const unsigned char *buffer = data.bytes;
    for (size_t i = 0; i < size; i++ ) {
      if (((const unsigned char *)buffer)[i] == ((const unsigned char *)bytes)[match_count]) {
        match_count += 1;
        if (match_count == length) {
          found_size = i + 1;
          break;
        }
      } else {
        match_count = 0;
      }
    }
    return found_size;
  };
  [self _addConsumerWithScanner:consumer callback:dataHandler];
}

// Returns true if did work
- (BOOL)_innerPumpScanner
{
  BOOL didWork = NO;

  if (self.readyState >= ABI42_0_0RCTSR_CLOSING) {
    return didWork;
  }

  if (!_consumers.count) {
    return didWork;
  }

  size_t curSize = _readBuffer.length - _readBufferOffset;
  if (!curSize) {
    return didWork;
  }

  ABI42_0_0RCTSRIOConsumer *consumer = _consumers[0];

  size_t bytesNeeded = consumer.bytesNeeded;

  size_t foundSize = 0;
  if (consumer.consumer) {
    NSData *tempView = [NSData dataWithBytesNoCopy:(char *)_readBuffer.bytes + _readBufferOffset length:_readBuffer.length - _readBufferOffset freeWhenDone:NO];
    foundSize = consumer.consumer(tempView);
  } else {
    assert(consumer.bytesNeeded);
    if (curSize >= bytesNeeded) {
      foundSize = bytesNeeded;
    } else if (consumer.readToCurrentFrame) {
      foundSize = curSize;
    }
  }

  NSData *slice = nil;
  if (consumer.readToCurrentFrame || foundSize) {
    NSRange sliceRange = NSMakeRange(_readBufferOffset, foundSize);
    slice = [_readBuffer subdataWithRange:sliceRange];

    _readBufferOffset += foundSize;

    if (_readBufferOffset > 4096 && _readBufferOffset > (_readBuffer.length >> 1)) {
      _readBuffer = [[NSMutableData alloc] initWithBytes:(char *)_readBuffer.bytes + _readBufferOffset length:_readBuffer.length - _readBufferOffset];            _readBufferOffset = 0;
    }

    if (consumer.unmaskBytes) {
      NSMutableData *mutableSlice = [slice mutableCopy];

      NSUInteger len = mutableSlice.length;
      uint8_t *bytes = mutableSlice.mutableBytes;

      for (NSUInteger i = 0; i < len; i++) {
        bytes[i] = bytes[i] ^ _currentReadMaskKey[_currentReadMaskOffset % sizeof(_currentReadMaskKey)];
        _currentReadMaskOffset += 1;
      }

      slice = mutableSlice;
    }

    if (consumer.readToCurrentFrame) {
      [_currentFrameData appendData:slice];

      _readOpCount += 1;

      if (_currentFrameOpcode == ABI42_0_0RCTSROpCodeTextFrame) {
        // Validate UTF8 stuff.
        size_t currentDataSize = _currentFrameData.length;
        if (_currentFrameOpcode == ABI42_0_0RCTSROpCodeTextFrame && currentDataSize > 0) {
          // TODO: Optimize this.  Don't really have to copy all the data each time

          size_t scanSize = currentDataSize - _currentStringScanPosition;

          NSData *scan_data = [_currentFrameData subdataWithRange:NSMakeRange(_currentStringScanPosition, scanSize)];
          int32_t valid_utf8_size = validate_dispatch_data_partial_string(scan_data);

          if (valid_utf8_size == -1) {
            [self closeWithCode:ABI42_0_0RCTSRStatusCodeInvalidUTF8 reason:@"Text frames must be valid UTF-8"];
            dispatch_async(_workQueue, ^{
              [self _disconnect];
            });
            return didWork;
          } else {
            _currentStringScanPosition += valid_utf8_size;
          }
        }
      }

      consumer.bytesNeeded -= foundSize;

      if (consumer.bytesNeeded == 0) {
        [_consumers removeObjectAtIndex:0];
        consumer.handler(self, nil);
        [_consumerPool returnConsumer:consumer];
        didWork = YES;
      }
    } else if (foundSize) {
      [_consumers removeObjectAtIndex:0];
      consumer.handler(self, slice);
      [_consumerPool returnConsumer:consumer];
      didWork = YES;
    }
  }
  return didWork;
}

- (void)_pumpScanner
{
  [self assertOnWorkQueue];

  if (!_isPumping) {
    _isPumping = YES;
  } else {
    return;
  }

  while ([self _innerPumpScanner]) {}

  _isPumping = NO;
}

//#define NOMASK

static const size_t ABI42_0_0RCTSRFrameHeaderOverhead = 32;

- (void)_sendFrameWithOpcode:(ABI42_0_0RCTSROpCode)opcode data:(NSData *)data
{
  [self assertOnWorkQueue];

  if (nil == data) {
    return;
  }

  size_t payloadLength = [data length];

  NSMutableData *frame = [[NSMutableData alloc] initWithLength:payloadLength + ABI42_0_0RCTSRFrameHeaderOverhead];
  if (!frame) {
    [self closeWithCode:ABI42_0_0RCTSRStatusCodeMessageTooBig reason:@"Message too big"];
    return;
  }
  uint8_t *frame_buffer = (uint8_t *)frame.mutableBytes;

  // set fin
  frame_buffer[0] = ABI42_0_0RCTSRFinMask | opcode;

  BOOL useMask = YES;
#ifdef NOMASK
  useMask = NO;
#endif

  if (useMask) {
    // set the mask and header
    frame_buffer[1] |= ABI42_0_0RCTSRMaskMask;
  }

  size_t frame_buffer_size = 2;

  const uint8_t *unmasked_payload = (uint8_t *)[data bytes];

  if (payloadLength < 126) {
    frame_buffer[1] |= payloadLength;
  } else if (payloadLength <= UINT16_MAX) {
    frame_buffer[1] |= 126;
    *((uint16_t *)(frame_buffer + frame_buffer_size)) = NSSwapBigShortToHost((uint16_t)payloadLength);
    frame_buffer_size += sizeof(uint16_t);
  } else {
    frame_buffer[1] |= 127;
    *((uint64_t *)(frame_buffer + frame_buffer_size)) = NSSwapBigLongLongToHost((uint64_t)payloadLength);
    frame_buffer_size += sizeof(uint64_t);
  }

  if (!useMask) {
    for (size_t i = 0; i < payloadLength; i++) {
      frame_buffer[frame_buffer_size] = unmasked_payload[i];
      frame_buffer_size += 1;
    }
  } else {
    uint8_t *mask_key = frame_buffer + frame_buffer_size;
    int result __unused = SecRandomCopyBytes(kSecRandomDefault, sizeof(uint32_t), (uint8_t *)mask_key);
    assert(result == 0);
    frame_buffer_size += sizeof(uint32_t);

    // TODO: could probably optimize this with SIMD
    for (size_t i = 0; i < payloadLength; i++) {
      frame_buffer[frame_buffer_size] = unmasked_payload[i] ^ mask_key[i % sizeof(uint32_t)];
      frame_buffer_size += 1;
    }
  }

  assert(frame_buffer_size <= [frame length]);
  frame.length = frame_buffer_size;

  [self _writeData:frame];
}

- (void)stream:(NSStream *)aStream handleEvent:(NSStreamEvent)eventCode
{
  if (_secure && !_pinnedCertFound && (eventCode == NSStreamEventHasBytesAvailable || eventCode == NSStreamEventHasSpaceAvailable)) {
    NSArray *sslCerts = _urlRequest.ABI42_0_0RCTSR_SSLPinnedCertificates;
    if (sslCerts) {
      SecTrustRef secTrust = (__bridge SecTrustRef)[aStream propertyForKey:(__bridge id)kCFStreamPropertySSLPeerTrust];
      if (secTrust) {
        NSInteger numCerts = SecTrustGetCertificateCount(secTrust);
        for (NSInteger i = 0; i < numCerts && !_pinnedCertFound; i++) {
          SecCertificateRef cert = SecTrustGetCertificateAtIndex(secTrust, i);
          NSData *certData = CFBridgingRelease(SecCertificateCopyData(cert));

          for (id ref in sslCerts) {
            SecCertificateRef trustedCert = (__bridge SecCertificateRef)ref;
            NSData *trustedCertData = CFBridgingRelease(SecCertificateCopyData(trustedCert));

            if ([trustedCertData isEqualToData:certData]) {
              _pinnedCertFound = YES;
              break;
            }
          }
        }
      }

      if (!_pinnedCertFound) {
        dispatch_async(_workQueue, ^{
          [self _failWithError:[NSError errorWithDomain:ABI42_0_0RCTSRWebSocketErrorDomain code:23556 userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Invalid server cert"]}]];
        });
        return;
      }
    }
  }
  
  // _workQueue cannot be NULL
  if (!_workQueue) {
    return;
  }
  __weak typeof(self) weakSelf = self;
  dispatch_async(_workQueue, ^{
    typeof(self) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    [strongSelf safeHandleEvent:eventCode stream:aStream];
  });
}

- (void)safeHandleEvent:(NSStreamEvent)eventCode stream:(NSStream *)aStream
{
  switch (eventCode) {
    case NSStreamEventOpenCompleted: {
      ABI42_0_0RCTSRLog(@"NSStreamEventOpenCompleted %@", aStream);
      if (self.readyState >= ABI42_0_0RCTSR_CLOSING) {
        return;
      }
      assert(self->_readBuffer);
      
      if (self.readyState == ABI42_0_0RCTSR_CONNECTING && aStream == self->_inputStream) {
        [self didConnect];
      }
      [self _pumpWriting];
      [self _pumpScanner];
      break;
    }
      
    case NSStreamEventErrorOccurred: {
      ABI42_0_0RCTSRLog(@"NSStreamEventErrorOccurred %@ %@", aStream, [aStream.streamError copy]);
      // TODO: specify error better!
      [self _failWithError:aStream.streamError];
      self->_readBufferOffset = 0;
      self->_readBuffer.length = 0;
      break;
      
    }
      
    case NSStreamEventEndEncountered: {
      [self _pumpScanner];
      ABI42_0_0RCTSRLog(@"NSStreamEventEndEncountered %@", aStream);
      if (aStream.streamError) {
        [self _failWithError:aStream.streamError];
      } else {
        dispatch_async(self->_workQueue, ^{
          if (self.readyState != ABI42_0_0RCTSR_CLOSED) {
            self.readyState = ABI42_0_0RCTSR_CLOSED;
            [self _scheduleCleanup];
          }
          
          if (!self->_sentClose && !self->_failed) {
            self->_sentClose = YES;
            // If we get closed in this state it's probably not clean because we should be sending this when we send messages
            [self _performDelegateBlock:^{
              if ([self.delegate respondsToSelector:@selector(webSocket:didCloseWithCode:reason:wasClean:)]) {
                [self.delegate webSocket:self didCloseWithCode:ABI42_0_0RCTSRStatusCodeGoingAway reason:@"Stream end encountered" wasClean:NO];
              }
            }];
          }
        });
      }
      
      break;
    }
      
    case NSStreamEventHasBytesAvailable: {
      ABI42_0_0RCTSRLog(@"NSStreamEventHasBytesAvailable %@", aStream);
      const int bufferSize = 2048;
      uint8_t buffer[bufferSize];
      
      while (self->_inputStream.hasBytesAvailable) {
        NSInteger bytes_read = [self->_inputStream read:buffer maxLength:bufferSize];
        
        if (bytes_read > 0) {
          [self->_readBuffer appendBytes:buffer length:bytes_read];
        } else if (bytes_read < 0) {
          [self _failWithError:self->_inputStream.streamError];
        }
        
        if (bytes_read != bufferSize) {
          break;
        }
      };
      [self _pumpScanner];
      break;
    }
      
    case NSStreamEventHasSpaceAvailable: {
      ABI42_0_0RCTSRLog(@"NSStreamEventHasSpaceAvailable %@", aStream);
      [self _pumpWriting];
      break;
    }
      
    default:
      ABI42_0_0RCTSRLog(@"(default)  %@", aStream);
      break;
  }
}

- (void)_scheduleCleanup
{
  if (_cleanupScheduled) {
    return;
  }
  
  _cleanupScheduled = YES;
  
  // Cleanup NSStream's delegate in the same RunLoop used by the streams themselves:
  // This way we'll prevent race conditions between handleEvent and SRWebsocket's dealloc
  NSTimer *timer = [NSTimer timerWithTimeInterval:(0.0f) target:self selector:@selector(_cleanupSelfReference:) userInfo:nil repeats:NO];
  [[NSRunLoop ABI42_0_0RCTSR_networkRunLoop] addTimer:timer forMode:NSDefaultRunLoopMode];
}

- (void)_cleanupSelfReference:(NSTimer *)timer
{
  // Remove the streams, right now, from the networkRunLoop
  [_inputStream close];
  [_outputStream close];
  
  // Unschedule from RunLoop
  for (NSArray *runLoop in [_scheduledRunloops copy]) {
    [self unscheduleFromRunLoop:runLoop[0] forMode:runLoop[1]];
  }
  
  // Nuke NSStream's delegate
  _inputStream.delegate = nil;
  _outputStream.delegate = nil;
  
  // Cleanup selfRetain in the same GCD queue as usual
  dispatch_async(_workQueue, ^{
    self->_selfRetain = nil;
  });
}

@end

@implementation ABI42_0_0RCTSRIOConsumer

- (void)setupWithScanner:(stream_scanner)scanner handler:(data_callback)handler bytesNeeded:(size_t)bytesNeeded readToCurrentFrame:(BOOL)readToCurrentFrame unmaskBytes:(BOOL)unmaskBytes
{
  _consumer = [scanner copy];
  _handler = [handler copy];
  _bytesNeeded = bytesNeeded;
  _readToCurrentFrame = readToCurrentFrame;
  _unmaskBytes = unmaskBytes;
  assert(_consumer || _bytesNeeded);
}

@end

@implementation ABI42_0_0RCTSRIOConsumerPool
{
  NSUInteger _poolSize;
  NSMutableArray<ABI42_0_0RCTSRIOConsumer *> *_bufferedConsumers;
}

- (instancetype)initWithBufferCapacity:(NSUInteger)poolSize
{
  if ((self = [super init])) {
    _poolSize = poolSize;
    _bufferedConsumers = [[NSMutableArray alloc] initWithCapacity:poolSize];
  }
  return self;
}

- (instancetype)init
{
  return [self initWithBufferCapacity:8];
}

- (ABI42_0_0RCTSRIOConsumer *)consumerWithScanner:(stream_scanner)scanner handler:(data_callback)handler bytesNeeded:(size_t)bytesNeeded readToCurrentFrame:(BOOL)readToCurrentFrame unmaskBytes:(BOOL)unmaskBytes
{
  ABI42_0_0RCTSRIOConsumer *consumer = nil;
  if (_bufferedConsumers.count) {
    consumer = _bufferedConsumers.lastObject;
    [_bufferedConsumers removeLastObject];
  } else {
    consumer = [ABI42_0_0RCTSRIOConsumer new];
  }

  [consumer setupWithScanner:scanner handler:handler bytesNeeded:bytesNeeded readToCurrentFrame:readToCurrentFrame unmaskBytes:unmaskBytes];

  return consumer;
}

- (void)returnConsumer:(ABI42_0_0RCTSRIOConsumer *)consumer
{
  if (_bufferedConsumers.count < _poolSize) {
    [_bufferedConsumers addObject:consumer];
  }
}

@end

@implementation  NSURLRequest (CertificateAdditions)

- (NSArray *)ABI42_0_0RCTSR_SSLPinnedCertificates
{
  return [NSURLProtocol propertyForKey:@"ABI42_0_0RCTSR_SSLPinnedCertificates" inRequest:self];
}

@end

@implementation  NSMutableURLRequest (CertificateAdditions)

- (NSArray *)ABI42_0_0RCTSR_SSLPinnedCertificates
{
  return [NSURLProtocol propertyForKey:@"ABI42_0_0RCTSR_SSLPinnedCertificates" inRequest:self];
}

- (void)setABI42_0_0RCTSR_SSLPinnedCertificates:(NSArray *)ABI42_0_0RCTSR_SSLPinnedCertificates
{
  [NSURLProtocol setProperty:ABI42_0_0RCTSR_SSLPinnedCertificates forKey:@"ABI42_0_0RCTSR_SSLPinnedCertificates" inRequest:self];
}

@end

@implementation NSURL (ABI42_0_0RCTSRWebSocket)

- (NSString *)ABI42_0_0RCTSR_origin
{
  NSString *scheme = self.scheme.lowercaseString;

  if ([scheme isEqualToString:@"wss"]) {
    scheme = @"https";
  } else if ([scheme isEqualToString:@"ws"]) {
    scheme = @"http";
  }

  int defaultPort = ([scheme isEqualToString:@"https"] ? 443 :
                     [scheme isEqualToString:@"http"] ? 80 :
                     -1);
  int port = self.port.intValue;
  if (port > 0 && port != defaultPort) {
    return [NSString stringWithFormat:@"%@://%@:%d", scheme, self.host, port];
  } else {
    return [NSString stringWithFormat:@"%@://%@", scheme, self.host];
  }
}

@end

static _ABI42_0_0RCTSRRunLoopThread *networkThread = nil;
static NSRunLoop *networkRunLoop = nil;

@implementation NSRunLoop (ABI42_0_0RCTSRWebSocket)

+ (NSRunLoop *)ABI42_0_0RCTSR_networkRunLoop
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    networkThread = [_ABI42_0_0RCTSRRunLoopThread new];
    networkThread.name = @"com.squareup.SocketRocket.NetworkThread";
    [networkThread start];
    networkRunLoop = networkThread.runLoop;
  });

  return networkRunLoop;
}

@end

@implementation _ABI42_0_0RCTSRRunLoopThread
{
  dispatch_group_t _waitGroup;
}

@synthesize runLoop = _runLoop;

- (instancetype)init
{
  if ((self = [super init])) {
    _waitGroup = dispatch_group_create();
    dispatch_group_enter(_waitGroup);
  }
  return self;
}

- (void)main
{
  @autoreleasepool {
    _runLoop = [NSRunLoop currentRunLoop];
    dispatch_group_leave(_waitGroup);

    NSTimer *timer = [[NSTimer alloc] initWithFireDate:[NSDate distantFuture] interval:0.0 target:self selector:@selector(step) userInfo:nil repeats:NO];
    [_runLoop addTimer:timer forMode:NSDefaultRunLoopMode];

    while ([_runLoop runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]]) { }
    assert(NO);
  }
}

- (void)step
{
  // Does nothing
}

- (NSRunLoop *)runLoop
{
  dispatch_group_wait(_waitGroup, DISPATCH_TIME_FOREVER);
  return _runLoop;
}

@end
