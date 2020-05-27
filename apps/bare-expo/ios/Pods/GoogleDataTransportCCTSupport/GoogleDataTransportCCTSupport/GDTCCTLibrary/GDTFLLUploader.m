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

#import "GDTCCTLibrary/Private/GDTFLLUploader.h"

#import <zlib.h>

#import <GoogleDataTransport/GDTCORConsoleLogger.h>
#import <GoogleDataTransport/GDTCORPlatform.h>
#import <GoogleDataTransport/GDTCORRegistrar.h>

#import <nanopb/pb.h>
#import <nanopb/pb_decode.h>
#import <nanopb/pb_encode.h>

#import "GDTCCTLibrary/Private/GDTCCTNanopbHelpers.h"
#import "GDTCCTLibrary/Private/GDTFLLPrioritizer.h"

#import "GDTCCTLibrary/Protogen/nanopb/cct.nanopb.h"

#ifdef GDTCCTSUPPORT_VERSION
#define STR(x) STR_EXPAND(x)
#define STR_EXPAND(x) #x
static NSString *const kGDTCCTSupportSDKVersion = @STR(GDTCCTSUPPORT_VERSION);
#else
static NSString *const kGDTCCTSupportSDKVersion = @"UNKNOWN";
#endif  // GDTCCTSUPPORT_VERSION

#if !NDEBUG
NSNotificationName const GDTFLLUploadCompleteNotification = @"com.GDTFLLUploader.UploadComplete";
#endif  // #if !NDEBUG

@interface GDTFLLUploader () <NSURLSessionDelegate>

// Redeclared as readwrite.
@property(nullable, nonatomic, readwrite) NSURLSessionUploadTask *currentTask;

@end

@implementation GDTFLLUploader

+ (void)load {
  GDTFLLUploader *uploader = [GDTFLLUploader sharedInstance];
  [[GDTCORRegistrar sharedInstance] registerUploader:uploader target:kGDTCORTargetFLL];
}

+ (instancetype)sharedInstance {
  static GDTFLLUploader *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[GDTFLLUploader alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _uploaderQueue = dispatch_queue_create("com.google.GDTFLLUploader", DISPATCH_QUEUE_SERIAL);
    NSURLSessionConfiguration *config = [NSURLSessionConfiguration defaultSessionConfiguration];
    _uploaderSession = [NSURLSession sessionWithConfiguration:config
                                                     delegate:self
                                                delegateQueue:nil];
  }
  return self;
}

- (NSURL *)defaultServerURL {
  static NSURL *defaultServerURL;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // These strings should be interleaved to construct the real URL. This is just to (hopefully)
    // fool github URL scanning bots.
    const char *p1 = "hts/frbslgigp.ogepscmv/ieo/eaybtho";
    const char *p2 = "tp:/ieaeogn-agolai.o/1frlglgc/aclg";
    const char defaultURL[69] = {
        p1[0],  p2[0],  p1[1],  p2[1],  p1[2],  p2[2],  p1[3],  p2[3],  p1[4],  p2[4],
        p1[5],  p2[5],  p1[6],  p2[6],  p1[7],  p2[7],  p1[8],  p2[8],  p1[9],  p2[9],
        p1[10], p2[10], p1[11], p2[11], p1[12], p2[12], p1[13], p2[13], p1[14], p2[14],
        p1[15], p2[15], p1[16], p2[16], p1[17], p2[17], p1[18], p2[18], p1[19], p2[19],
        p1[20], p2[20], p1[21], p2[21], p1[22], p2[22], p1[23], p2[23], p1[24], p2[24],
        p1[25], p2[25], p1[26], p2[26], p1[27], p2[27], p1[28], p2[28], p1[29], p2[29],
        p1[30], p2[30], p1[31], p2[31], p1[32], p2[32], p1[33], p2[33], '\0'};
    defaultServerURL = [NSURL URLWithString:[NSString stringWithUTF8String:defaultURL]];
  });
  return defaultServerURL;
}

- (NSString *)defaultAPIKey {
  static NSString *defaultServerKey;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // These strings should be interleaved to construct the real key.
    const char *p1 = "AzSBG0honD6A-PxV5nBc";
    const char *p2 = "Iay44Iwtu2vV0AOrz1C";
    const char defaultKey[40] = {p1[0],  p2[0],  p1[1],  p2[1],  p1[2],  p2[2],  p1[3],  p2[3],
                                 p1[4],  p2[4],  p1[5],  p2[5],  p1[6],  p2[6],  p1[7],  p2[7],
                                 p1[8],  p2[8],  p1[9],  p2[9],  p1[10], p2[10], p1[11], p2[11],
                                 p1[12], p2[12], p1[13], p2[13], p1[14], p2[14], p1[15], p2[15],
                                 p1[16], p2[16], p1[17], p2[17], p1[18], p2[18], p1[19], '\0'};
    defaultServerKey = [NSString stringWithUTF8String:defaultKey];
  });
  return defaultServerKey;
}

- (void)uploadPackage:(GDTCORUploadPackage *)package {
  __block GDTCORBackgroundIdentifier bgID = GDTCORBackgroundIdentifierInvalid;
  bgID = [[GDTCORApplication sharedApplication]
      beginBackgroundTaskWithName:@"GDTFLLUploader-upload"
                expirationHandler:^{
                  if (bgID != GDTCORBackgroundIdentifierInvalid) {
                    // Cancel the upload and complete delivery.
                    [self.currentTask cancel];
                    [self.currentUploadPackage completeDelivery];

                    // End the background task.
                    [[GDTCORApplication sharedApplication] endBackgroundTask:bgID];
                  }
                }];

  dispatch_async(_uploaderQueue, ^{
    if (self->_currentTask || self->_currentUploadPackage) {
      GDTCORLogWarning(GDTCORMCWUploadFailed, @"%@",
                       @"An upload shouldn't be initiated with another in progress.");
      return;
    }
    NSURL *serverURL = self.serverURL ? self.serverURL : [self defaultServerURL];

    id completionHandler = ^(NSData *_Nullable data, NSURLResponse *_Nullable response,
                             NSError *_Nullable error) {
      if (error) {
        GDTCORLogWarning(GDTCORMCWUploadFailed, @"There was an error uploading events: %@", error);
      }
      NSError *decodingError;
      if (data) {
        gdt_cct_LogResponse logResponse = GDTCCTDecodeLogResponse(data, &decodingError);
        if (!decodingError && logResponse.has_next_request_wait_millis) {
          self->_nextUploadTime =
              [GDTCORClock clockSnapshotInTheFuture:logResponse.next_request_wait_millis];
        } else {
          // 15 minutes from now.
          self->_nextUploadTime = [GDTCORClock clockSnapshotInTheFuture:15 * 60 * 1000];
        }
        pb_release(gdt_cct_LogResponse_fields, &logResponse);
      }

      // Only retry if one of these codes is returned.
      if (((NSHTTPURLResponse *)response).statusCode == 429 ||
          ((NSHTTPURLResponse *)response).statusCode == 503) {
        [package retryDeliveryInTheFuture];
      } else {
#if !NDEBUG
        // Post a notification when in DEBUG mode to state how many packages were uploaded. Useful
        // for validation during tests.
        [[NSNotificationCenter defaultCenter] postNotificationName:GDTFLLUploadCompleteNotification
                                                            object:@(package.events.count)];
#endif  // #if !NDEBUG
        [package completeDelivery];
      }

      // End the background task if there was one.
      if (bgID != GDTCORBackgroundIdentifierInvalid) {
        [[GDTCORApplication sharedApplication] endBackgroundTask:bgID];
        bgID = GDTCORBackgroundIdentifierInvalid;
      }
      self.currentTask = nil;
      self.currentUploadPackage = nil;
    };
    self->_currentUploadPackage = package;
    NSData *requestProtoData =
        [self constructRequestProtoFromPackage:(GDTCORUploadPackage *)package];
    NSData *gzippedData = [GDTFLLUploader gzippedData:requestProtoData];
    BOOL usingGzipData = gzippedData != nil && gzippedData.length < requestProtoData.length;
    NSData *dataToSend = usingGzipData ? gzippedData : requestProtoData;
    NSURLRequest *request = [self constructRequestWithURL:serverURL data:dataToSend];
    self.currentTask = [self.uploaderSession uploadTaskWithRequest:request
                                                          fromData:gzippedData
                                                 completionHandler:completionHandler];
    [self.currentTask resume];
  });
}

- (BOOL)readyToUploadWithConditions:(GDTCORUploadConditions)conditions {
  __block BOOL result = NO;
  dispatch_sync(_uploaderQueue, ^{
    if (self->_currentUploadPackage) {
      result = NO;
      return;
    }
    if (self->_currentTask) {
      result = NO;
      return;
    }
    if ((conditions & GDTCORUploadConditionHighPriority) == GDTCORUploadConditionHighPriority) {
      result = YES;
      return;
    } else if (self->_nextUploadTime) {
      result = [[GDTCORClock snapshot] isAfter:self->_nextUploadTime];
      return;
    }
    result = YES;
  });
  return result;
}

#pragma mark - Private helper methods

/** Compresses the given data and returns a new data object.
 *
 * @note Reduced version from GULNSData+zlib.m of GoogleUtilities.
 * @return Compressed data, or nil if there was an error.
 */
+ (nullable NSData *)gzippedData:(NSData *)data {
#if defined(__LP64__) && __LP64__
  // Don't support > 32bit length for 64 bit, see note in header.
  if (data.length > UINT_MAX) {
    return nil;
  }
#endif

  const uint kChunkSize = 1024;

  const void *bytes = [data bytes];
  NSUInteger length = [data length];

  int level = Z_DEFAULT_COMPRESSION;
  if (!bytes || !length) {
    return nil;
  }

  z_stream strm;
  bzero(&strm, sizeof(z_stream));

  int memLevel = 8;          // Default.
  int windowBits = 15 + 16;  // Enable gzip header instead of zlib header.

  int retCode;
  if ((retCode = deflateInit2(&strm, level, Z_DEFLATED, windowBits, memLevel,
                              Z_DEFAULT_STRATEGY)) != Z_OK) {
    return nil;
  }

  // Hint the size at 1/4 the input size.
  NSMutableData *result = [NSMutableData dataWithCapacity:(length / 4)];
  unsigned char output[kChunkSize];

  // Setup the input.
  strm.avail_in = (unsigned int)length;
  strm.next_in = (unsigned char *)bytes;

  // Collect the data.
  do {
    // update what we're passing in
    strm.avail_out = kChunkSize;
    strm.next_out = output;
    retCode = deflate(&strm, Z_FINISH);
    if ((retCode != Z_OK) && (retCode != Z_STREAM_END)) {
      deflateEnd(&strm);
      return nil;
    }
    // Collect what we got.
    unsigned gotBack = kChunkSize - strm.avail_out;
    if (gotBack > 0) {
      [result appendBytes:output length:gotBack];
    }

  } while (retCode == Z_OK);

  // If the loop exits, it used all input and the stream ended.
  NSAssert(strm.avail_in == 0,
           @"Should have finished deflating without using all input, %u bytes left", strm.avail_in);
  NSAssert(retCode == Z_STREAM_END,
           @"thought we finished deflate w/o getting a result of stream end, code %d", retCode);

  // Clean up.
  deflateEnd(&strm);

  return result;
}

/** Constructs data given an upload package.
 *
 * @param package The upload package used to construct the request proto bytes.
 * @return Proto bytes representing a gdt_cct_LogRequest object.
 */
- (nonnull NSData *)constructRequestProtoFromPackage:(GDTCORUploadPackage *)package {
  // Segment the log events by log type.
  NSMutableDictionary<NSString *, NSMutableSet<GDTCORStoredEvent *> *> *logMappingIDToLogSet =
      [[NSMutableDictionary alloc] init];
  [package.events
      enumerateObjectsUsingBlock:^(GDTCORStoredEvent *_Nonnull event, BOOL *_Nonnull stop) {
        NSMutableSet *logSet = logMappingIDToLogSet[event.mappingID];
        logSet = logSet ? logSet : [[NSMutableSet alloc] init];
        [logSet addObject:event];
        logMappingIDToLogSet[event.mappingID] = logSet;
      }];

  gdt_cct_BatchedLogRequest batchedLogRequest =
      GDTCCTConstructBatchedLogRequest(logMappingIDToLogSet);

  NSData *data = GDTCCTEncodeBatchedLogRequest(&batchedLogRequest);
  pb_release(gdt_cct_BatchedLogRequest_fields, &batchedLogRequest);
  return data ? data : [[NSData alloc] init];
}

/** Constructs a request to FLL given a URL and request body data.
 *
 * @param URL The URL to send the request to.
 * @param data The request body data.
 * @return A new NSURLRequest ready to be sent to FLL.
 */
- (NSURLRequest *)constructRequestWithURL:(NSURL *)URL data:(NSData *)data {
  const UInt8 *bytes = (const UInt8 *)data.bytes;
  // From https://en.wikipedia.org/wiki/Gzip, gzip's magic number is 1f 8b.
  BOOL isGzipped = (data.length >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b);
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  [request setValue:[self defaultAPIKey] forHTTPHeaderField:@"X-Goog-Api-Key"];
  [request setValue:@"application/x-protobuf" forHTTPHeaderField:@"Content-Type"];
  if (isGzipped) {
    [request setValue:@"gzip" forHTTPHeaderField:@"Content-Encoding"];
  }
  [request setValue:@"gzip" forHTTPHeaderField:@"Accept-Encoding"];
  NSString *userAgent = [NSString stringWithFormat:@"datatransport/%@ fllsupport/%@ apple/",
                                                   kGDTCORVersion, kGDTCCTSupportSDKVersion];
  [request setValue:userAgent forHTTPHeaderField:@"User-Agent"];
  request.HTTPMethod = @"POST";
  [request setHTTPBody:data];
  return request;
}

#pragma mark - GDTCORUploadPackageProtocol

- (void)packageExpired:(GDTCORUploadPackage *)package {
  dispatch_async(_uploaderQueue, ^{
    [self.currentTask cancel];
    self.currentTask = nil;
    self.currentUploadPackage = nil;
  });
}

#pragma mark - GDTCORLifecycleProtocol

- (void)appWillTerminate:(GDTCORApplication *)application {
  dispatch_sync(_uploaderQueue, ^{
    [self.currentTask cancel];
    [self.currentUploadPackage completeDelivery];
  });
}

#pragma mark - NSURLSessionDelegate

- (void)URLSession:(NSURLSession *)session
                          task:(NSURLSessionTask *)task
    willPerformHTTPRedirection:(NSHTTPURLResponse *)response
                    newRequest:(NSURLRequest *)request
             completionHandler:(void (^)(NSURLRequest *_Nullable))completionHandler {
  if (!completionHandler) {
    return;
  }
  if (response.statusCode == 302 || response.statusCode == 301) {
    NSURLRequest *newRequest = [self constructRequestWithURL:request.URL
                                                        data:task.originalRequest.HTTPBody];
    completionHandler(newRequest);
  } else {
    completionHandler(request);
  }
}

@end
