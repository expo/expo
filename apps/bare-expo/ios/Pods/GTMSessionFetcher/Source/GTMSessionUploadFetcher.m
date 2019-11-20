/* Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "GTMSessionUploadFetcher.h"

static NSString *const kGTMSessionIdentifierIsUploadChunkFetcherMetadataKey = @"_upChunk";
static NSString *const kGTMSessionIdentifierUploadFileURLMetadataKey        = @"_upFileURL";
static NSString *const kGTMSessionIdentifierUploadFileLengthMetadataKey     = @"_upFileLen";
static NSString *const kGTMSessionIdentifierUploadLocationURLMetadataKey    = @"_upLocURL";
static NSString *const kGTMSessionIdentifierUploadMIMETypeMetadataKey       = @"_uploadMIME";
static NSString *const kGTMSessionIdentifierUploadChunkSizeMetadataKey      = @"_upChSize";
static NSString *const kGTMSessionIdentifierUploadCurrentOffsetMetadataKey  = @"_upOffset";

static NSString *const kGTMSessionHeaderXGoogUploadChunkGranularity = @"X-Goog-Upload-Chunk-Granularity";
static NSString *const kGTMSessionHeaderXGoogUploadCommand          = @"X-Goog-Upload-Command";
static NSString *const kGTMSessionHeaderXGoogUploadContentLength    = @"X-Goog-Upload-Content-Length";
static NSString *const kGTMSessionHeaderXGoogUploadContentType      = @"X-Goog-Upload-Content-Type";
static NSString *const kGTMSessionHeaderXGoogUploadOffset           = @"X-Goog-Upload-Offset";
static NSString *const kGTMSessionHeaderXGoogUploadProtocol         = @"X-Goog-Upload-Protocol";
static NSString *const kGTMSessionXGoogUploadProtocolResumable      = @"resumable";
static NSString *const kGTMSessionHeaderXGoogUploadSizeReceived     = @"X-Goog-Upload-Size-Received";
static NSString *const kGTMSessionHeaderXGoogUploadStatus           = @"X-Goog-Upload-Status";
static NSString *const kGTMSessionHeaderXGoogUploadURL              = @"X-Goog-Upload-URL";

// Property of chunk fetchers identifying the parent upload fetcher.  Non-retained NSValue.
static NSString *const kGTMSessionUploadFetcherChunkParentKey = @"_uploadFetcherChunkParent";

int64_t const kGTMSessionUploadFetcherUnknownFileSize = -1;

int64_t const kGTMSessionUploadFetcherStandardChunkSize = (int64_t)LLONG_MAX;

#if TARGET_OS_IPHONE
int64_t const kGTMSessionUploadFetcherMaximumDemandBufferSize = 10 * 1024 * 1024;  // 10 MB for iOS, watchOS, tvOS
#else
int64_t const kGTMSessionUploadFetcherMaximumDemandBufferSize = 100 * 1024 * 1024;  // 100 MB for macOS
#endif

typedef NS_ENUM(NSUInteger, GTMSessionUploadFetcherStatus) {
  kStatusUnknown,
  kStatusActive,
  kStatusFinal,
  kStatusCancelled,
};

NSString *const kGTMSessionFetcherUploadLocationObtainedNotification =
    @"kGTMSessionFetcherUploadLocationObtainedNotification";

#if !GTMSESSION_BUILD_COMBINED_SOURCES
@interface GTMSessionFetcher (ProtectedMethods)

// Access to non-public method on the parent fetcher class.
- (void)stopFetchReleasingCallbacks:(BOOL)shouldReleaseCallbacks;
- (void)createSessionIdentifierWithMetadata:(NSDictionary *)metadata;
- (GTMSessionFetcherCompletionHandler)completionHandlerWithTarget:(id)target
                                                didFinishSelector:(SEL)finishedSelector;
- (void)invokeOnCallbackQueue:(dispatch_queue_t)callbackQueue
             afterUserStopped:(BOOL)afterStopped
                        block:(void (^)(void))block;
- (NSTimer *)retryTimer;
- (void)beginFetchForRetry;

@property(readwrite, strong) NSData *downloadedData;
- (void)releaseCallbacks;

- (NSInteger)statusCodeUnsynchronized;

- (BOOL)userStoppedFetching;

@end
#endif  // !GTMSESSION_BUILD_COMBINED_SOURCES

@interface GTMSessionUploadFetcher ()

// Changing readonly to readwrite.
@property(atomic, strong, readwrite) NSURLRequest *lastChunkRequest;
@property(atomic, readwrite, assign) int64_t currentOffset;

// Internal properties.
@property(strong, atomic, GTM_NULLABLE) GTMSessionFetcher *fetcherInFlight;  // Synchronized on self.

@property(assign, atomic, getter=isSubdataGenerating) BOOL subdataGenerating;
@property(assign, atomic) BOOL shouldInitiateOffsetQuery;
@property(assign, atomic) int64_t uploadGranularity;

@end

@implementation GTMSessionUploadFetcher {
  GTMSessionFetcher *_chunkFetcher;

  // We'll call through to the delegate's completion handler.
  GTMSessionFetcherCompletionHandler _delegateCompletionHandler;
  dispatch_queue_t _delegateCallbackQueue;

  // The initial fetch's body length and bytes actually sent are
  // needed for calculating progress during subsequent chunk uploads
  int64_t _initialBodyLength;
  int64_t _initialBodySent;

  // The upload server address for the chunks of this upload session.
  NSURL *_uploadLocationURL;

  // _uploadData, _uploadDataProvider, or _uploadFileHandle may be set, but only one.
  NSData *_uploadData;
  NSFileHandle *_uploadFileHandle;
  GTMSessionUploadFetcherDataProvider _uploadDataProvider;
  NSURL *_uploadFileURL;
  int64_t _uploadFileLength;
  NSString *_uploadMIMEType;
  int64_t _chunkSize;
  int64_t _uploadGranularity;
  BOOL _isPaused;
  BOOL _isRestartedUpload;
  BOOL _shouldInitiateOffsetQuery;

  // Tied to useBackgroundSession property, since this property is applicable to chunk fetchers.
  BOOL _useBackgroundSessionOnChunkFetchers;

  // We keep the latest offset into the upload data just for progress reporting.
  int64_t _currentOffset;

  NSDictionary *_recentChunkReponseHeaders;
  NSInteger _recentChunkStatusCode;

  // For waiting, we need to know the fetcher in flight, if any, and if subdata generation
  // is in progress.
  GTMSessionFetcher *_fetcherInFlight;
  BOOL _isSubdataGenerating;
  BOOL _isCancelInFlight;

  GTMSessionUploadFetcherCancellationHandler _cancellationHandler;
}

+ (void)load {
  [self uploadFetchersForBackgroundSessions];
}

+ (instancetype)uploadFetcherWithRequest:(NSURLRequest *)request
                          uploadMIMEType:(NSString *)uploadMIMEType
                               chunkSize:(int64_t)chunkSize
                          fetcherService:(GTMSessionFetcherService *)fetcherService {
  GTMSessionUploadFetcher *fetcher = [self uploadFetcherWithRequest:request
                                                     fetcherService:fetcherService];
  [fetcher setLocationURL:nil
           uploadMIMEType:uploadMIMEType
                chunkSize:chunkSize];
  return fetcher;
}

+ (instancetype)uploadFetcherWithLocation:(NSURL * GTM_NULLABLE_TYPE)uploadLocationURL
                           uploadMIMEType:(NSString *)uploadMIMEType
                                chunkSize:(int64_t)chunkSize
                           fetcherService:(GTMSessionFetcherService *)fetcherService {
  GTMSessionUploadFetcher *fetcher = [self uploadFetcherWithRequest:nil
                                                     fetcherService:fetcherService];
  [fetcher setLocationURL:uploadLocationURL
           uploadMIMEType:uploadMIMEType
                chunkSize:chunkSize];
  return fetcher;
}

+ (instancetype)uploadFetcherForSessionIdentifierMetadata:(NSDictionary *)metadata {
  GTMSESSION_ASSERT_DEBUG(
      [metadata[kGTMSessionIdentifierIsUploadChunkFetcherMetadataKey] boolValue],
      @"Session identifier metadata is not for an upload fetcher: %@", metadata);

  NSNumber *uploadFileLengthNum = metadata[kGTMSessionIdentifierUploadFileLengthMetadataKey];
  GTMSESSION_ASSERT_DEBUG(uploadFileLengthNum != nil,
                          @"Session metadata missing an UploadFileSize");
  if (uploadFileLengthNum == nil) return nil;

  int64_t uploadFileLength = [uploadFileLengthNum longLongValue];
  GTMSESSION_ASSERT_DEBUG(uploadFileLength >= 0, @"Session metadata UploadFileSize is unknown");

  NSString *uploadFileURLString = metadata[kGTMSessionIdentifierUploadFileURLMetadataKey];
  GTMSESSION_ASSERT_DEBUG(uploadFileURLString, @"Session metadata missing an UploadFileURL");
  if (uploadFileURLString == nil) return nil;

  NSURL *uploadFileURL = [NSURL URLWithString:uploadFileURLString];
  // There used to be a call here to NSURL checkResourceIsReachableAndReturnError: to check for the
  // existence of the file (also tried NSFileManager fileExistsAtPath:). We've determined
  // empirically that the check can fail at startup even when the upload file does in fact exist.
  // For now, we'll go ahead and restore the background upload fetcher. If the file doesn't exist,
  // it will fail later.

  NSString *uploadLocationURLString = metadata[kGTMSessionIdentifierUploadLocationURLMetadataKey];
  NSURL *uploadLocationURL =
      uploadLocationURLString ? [NSURL URLWithString:uploadLocationURLString] : nil;

  NSString *uploadMIMEType =
      metadata[kGTMSessionIdentifierUploadMIMETypeMetadataKey];
  int64_t uploadChunkSize =
      [metadata[kGTMSessionIdentifierUploadChunkSizeMetadataKey] longLongValue];
  if (uploadChunkSize <= 0) {
    uploadChunkSize = kGTMSessionUploadFetcherStandardChunkSize;
  }
  int64_t currentOffset =
      [metadata[kGTMSessionIdentifierUploadCurrentOffsetMetadataKey] longLongValue];
  GTMSESSION_ASSERT_DEBUG(currentOffset <= uploadFileLength,
                          @"CurrentOffset (%lld) exceeds UploadFileSize (%lld)",
                          currentOffset, uploadFileLength);
  if (currentOffset > uploadFileLength) return nil;

  GTMSessionUploadFetcher *uploadFetcher = [self uploadFetcherWithLocation:uploadLocationURL
                                                            uploadMIMEType:uploadMIMEType
                                                                 chunkSize:uploadChunkSize
                                                            fetcherService:nil];
  // Set the upload file length before setting the upload file URL tries to determine the length.
  [uploadFetcher setUploadFileLength:uploadFileLength];

  uploadFetcher.uploadFileURL = uploadFileURL;
  uploadFetcher.sessionUserInfo = metadata;
  uploadFetcher.useBackgroundSession = YES;
  uploadFetcher.currentOffset = currentOffset;
  uploadFetcher.delegateCallbackQueue = uploadFetcher.callbackQueue;
  uploadFetcher.allowedInsecureSchemes = @[ @"http" ];  // Allowed on restored upload fetcher.
  return uploadFetcher;
}

+ (instancetype)uploadFetcherWithRequest:(NSURLRequest *)request
                          fetcherService:(GTMSessionFetcherService *)fetcherService {
  // Internal utility method for instantiating fetchers
  GTMSessionUploadFetcher *fetcher;
  if ([fetcherService isKindOfClass:[GTMSessionFetcherService class]]) {
    fetcher = [fetcherService fetcherWithRequest:request
                                    fetcherClass:self];
  } else {
    fetcher = [self fetcherWithRequest:request];
  }
  fetcher.useBackgroundSession = YES;
  return fetcher;
}

+ (NSPointerArray *)uploadFetcherPointerArrayForBackgroundSessions {
  static NSPointerArray *gUploadFetcherPointerArrayForBackgroundSessions = nil;

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    gUploadFetcherPointerArrayForBackgroundSessions = [NSPointerArray weakObjectsPointerArray];
  });
  return gUploadFetcherPointerArrayForBackgroundSessions;
}

+ (instancetype)uploadFetcherForSessionIdentifier:(NSString *)sessionIdentifier {
  GTMSESSION_ASSERT_DEBUG(sessionIdentifier != nil, @"Invalid session identifier");
  NSArray *uploadFetchersForBackgroundSessions = [self uploadFetchersForBackgroundSessions];
  for (GTMSessionUploadFetcher *uploadFetcher in uploadFetchersForBackgroundSessions) {
    if ([uploadFetcher.chunkFetcher.sessionIdentifier isEqual:sessionIdentifier]) {
      return uploadFetcher;
    }
  }
  return nil;
}

+ (NSArray *)uploadFetchersForBackgroundSessions {
  NSMutableSet *restoredSessionIdentifiers = [[NSMutableSet alloc] init];
  NSMutableArray *uploadFetchers = [[NSMutableArray alloc] init];
  NSPointerArray *uploadFetcherPointerArray = [self uploadFetcherPointerArrayForBackgroundSessions];

  // Collect the background session upload fetchers that are still in memory.
  @synchronized(uploadFetcherPointerArray) {
    [uploadFetcherPointerArray compact];
    for (GTMSessionUploadFetcher *uploadFetcher in uploadFetcherPointerArray) {
      NSString *sessionIdentifier = uploadFetcher.chunkFetcher.sessionIdentifier;
      if (sessionIdentifier) {
        [restoredSessionIdentifiers addObject:sessionIdentifier];
        [uploadFetchers addObject:uploadFetcher];
      }
    }
  }  // @synchronized(uploadFetcherPointerArray)

  // The system may have other ongoing background upload sessions. Restore upload fetchers for those
  // too.
  NSArray *fetchers = [GTMSessionFetcher fetchersForBackgroundSessions];
  for (GTMSessionFetcher *fetcher in fetchers) {
    NSString *sessionIdentifier = fetcher.sessionIdentifier;
    if (!sessionIdentifier || [restoredSessionIdentifiers containsObject:sessionIdentifier]) {
      continue;
    }
    NSDictionary *sessionIdentifierMetadata = [fetcher sessionIdentifierMetadata];
    if (sessionIdentifierMetadata == nil) {
      continue;
    }
    if (![sessionIdentifierMetadata[kGTMSessionIdentifierIsUploadChunkFetcherMetadataKey] boolValue]) {
      continue;
    }
    GTMSessionUploadFetcher *uploadFetcher =
        [self uploadFetcherForSessionIdentifierMetadata:sessionIdentifierMetadata];
    if (uploadFetcher == nil) {
      // Something went wrong with this upload fetcher, so kill the restored chunk fetcher.
      [fetcher stopFetching];
      continue;
    }
    [uploadFetchers addObject:uploadFetcher];
    uploadFetcher->_chunkFetcher = fetcher;
    uploadFetcher->_fetcherInFlight = fetcher;
    [uploadFetcher attachSendProgressBlockToChunkFetcher:fetcher];
    fetcher.completionHandler =
        [fetcher completionHandlerWithTarget:uploadFetcher
                           didFinishSelector:@selector(chunkFetcher:finishedWithData:error:)];

    GTMSESSION_LOG_DEBUG(@"%@ restoring upload fetcher %@ for chunk fetcher %@",
                         [self class], uploadFetcher, fetcher);
  }
  return uploadFetchers;
}

- (void)setUploadData:(NSData *)data {
  BOOL changed = NO;

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_uploadData != data) {
      _uploadData = data;
      changed = YES;
    }
  }
  if (changed) {
    [self setupRequestHeaders];
  }
}

- (NSData *)uploadData {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _uploadData;
  }
}

- (void)setUploadFileHandle:(NSFileHandle *)fh {
  BOOL changed = NO;

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_uploadFileHandle != fh) {
      _uploadFileHandle = fh;
      changed = YES;
    }
  }
  if (changed) {
    [self setupRequestHeaders];
  }
}

- (NSFileHandle *)uploadFileHandle {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _uploadFileHandle;
  }
}

- (void)setUploadFileURL:(NSURL *)uploadURL {
  BOOL changed = NO;

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_uploadFileURL != uploadURL) {
      _uploadFileURL = uploadURL;
      changed = YES;
    }
  }
  if (changed) {
    [self setupRequestHeaders];
  }
}

- (NSURL *)uploadFileURL {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _uploadFileURL;
  }
}

- (void)setUploadFileLength:(int64_t)fullLength {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_uploadFileLength == kGTMSessionUploadFetcherUnknownFileSize &&
        fullLength != kGTMSessionUploadFetcherUnknownFileSize) {
      _uploadFileLength = fullLength;
    }
  }
}

- (void)setUploadDataLength:(int64_t)fullLength
                   provider:(GTMSessionUploadFetcherDataProvider)block {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _uploadDataProvider = [block copy];
    _uploadFileLength = fullLength;
  }
  [self setupRequestHeaders];
}

- (GTMSessionUploadFetcherDataProvider)uploadDataProvider {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _uploadDataProvider;
  }
}


- (void)setUploadMIMEType:(NSString *)uploadMIMEType {
  GTMSESSION_ASSERT_DEBUG(0, @"TODO: disallow setUploadMIMEType by making declaration readonly");
  // (and uploadMIMEType, chunksize, currentOffset)
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _uploadMIMEType = uploadMIMEType;
  }
}

- (NSString *)uploadMIMEType {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _uploadMIMEType;
  }
}

- (void)setChunkSize:(int64_t)chunkSize {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _chunkSize = chunkSize;
  }
}

- (int64_t)chunkSize {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _chunkSize;
  }
}

- (void)setupRequestHeaders {
  GTMSessionCheckNotSynchronized(self);

#if DEBUG
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    int hasData = (_uploadData != nil) ? 1 : 0;
    int hasFileHandle = (_uploadFileHandle != nil) ? 1 : 0;
    int hasFileURL = (_uploadFileURL != nil) ? 1 : 0;
    int hasUploadDataProvider = (_uploadDataProvider != nil) ? 1 : 0;
    int numberOfSources = hasData + hasFileHandle + hasFileURL + hasUploadDataProvider;
    #pragma unused(numberOfSources)
    GTMSESSION_ASSERT_DEBUG(numberOfSources == 1,
                            @"Need just one upload source (%d)", numberOfSources);
  }  // @synchronized(self)
#endif

  // Add our custom headers to the initial request indicating the data
  // type and total size to be delivered later in the chunk requests.
  NSMutableURLRequest *mutableRequest = [self.request mutableCopy];

  GTMSESSION_ASSERT_DEBUG((mutableRequest == nil) != (_uploadLocationURL == nil),
                          @"Request and location are mutually exclusive");
  if (!mutableRequest) return;

  [mutableRequest setValue:kGTMSessionXGoogUploadProtocolResumable
        forHTTPHeaderField:kGTMSessionHeaderXGoogUploadProtocol];
  [mutableRequest setValue:@"start"
        forHTTPHeaderField:kGTMSessionHeaderXGoogUploadCommand];
  [mutableRequest setValue:_uploadMIMEType
        forHTTPHeaderField:kGTMSessionHeaderXGoogUploadContentType];
  [mutableRequest setValue:@([self fullUploadLength]).stringValue
        forHTTPHeaderField:kGTMSessionHeaderXGoogUploadContentLength];

  NSString *method = mutableRequest.HTTPMethod;
  if (method == nil || [method caseInsensitiveCompare:@"GET"] == NSOrderedSame) {
    [mutableRequest setHTTPMethod:@"POST"];
  }

  // Ensure the user agent header identifies this to the upload server as a
  // GTMSessionUploadFetcher client.  The /1 can be incremented in the unlikely circumstance
  // we need to make a bug fix in the client that the server can recognize.
  NSString *const kUserAgentStub = @"(GTMSUF/1)";
  NSString *userAgent = [mutableRequest valueForHTTPHeaderField:@"User-Agent"];
  if (userAgent == nil
      || [userAgent rangeOfString:kUserAgentStub].location == NSNotFound) {
    if (userAgent.length == 0) {
      userAgent = GTMFetcherStandardUserAgentString(nil);
    }
    userAgent = [userAgent stringByAppendingFormat:@" %@", kUserAgentStub];
    [mutableRequest setValue:userAgent forHTTPHeaderField:@"User-Agent"];
  }
  [self setRequest:mutableRequest];
}

- (void)setLocationURL:(NSURL * GTM_NULLABLE_TYPE)location
        uploadMIMEType:(NSString *)uploadMIMEType
             chunkSize:(int64_t)chunkSize {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    GTMSESSION_ASSERT_DEBUG(chunkSize > 0, @"chunk size is zero");

    // When resuming an upload, set the known upload target URL.
    _uploadLocationURL = location;

    _uploadMIMEType = uploadMIMEType;
    _chunkSize = chunkSize;

    // Indicate that we've not yet determined the file handle's length
    _uploadFileLength = kGTMSessionUploadFetcherUnknownFileSize;

    // Indicate that we've not yet determined the upload fetcher status
    _recentChunkStatusCode = -1;

    // If this is restarting an upload begun by another fetcher,
    // the location is specified but the request is nil
    _isRestartedUpload = (location != nil);
  }  // @synchronized(self)
}

- (int64_t)fullUploadLength {
  int64_t result;
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_uploadData) {
      result = (int64_t)_uploadData.length;
    } else {
      if (_uploadFileLength == kGTMSessionUploadFetcherUnknownFileSize) {
        if (_uploadFileHandle) {
          // First time through, seek to end to determine file length
          _uploadFileLength = (int64_t)[_uploadFileHandle seekToEndOfFile];
        } else if (_uploadDataProvider) {
          // _uploadFileLength is set when the _uploadDataProvider is set.
          GTMSESSION_ASSERT_DEBUG(_uploadFileLength >= 0, @"No uploadDataProvider length set");
        } else {
          NSNumber *filesizeNum;
          NSError *valueError;
          if ([_uploadFileURL getResourceValue:&filesizeNum
                                        forKey:NSURLFileSizeKey
                                         error:&valueError]) {
            _uploadFileLength = filesizeNum.longLongValue;
          } else {
            GTMSESSION_ASSERT_DEBUG(NO, @"Cannot get file size: %@\n  %@",
                                    valueError, _uploadFileURL.path);
            _uploadFileLength = 0;
          }
        }
      }
      result = _uploadFileLength;
    }
  }  // @synchronized(self)
  return result;
}

// Make a subdata of the upload data.
- (void)generateChunkSubdataWithOffset:(int64_t)offset
                                length:(int64_t)length
                              response:(GTMSessionUploadFetcherDataProviderResponse)response {
  GTMSessionUploadFetcherDataProvider uploadDataProvider = self.uploadDataProvider;
  if (uploadDataProvider) {
    uploadDataProvider(offset, length, response);
    return;
  }

  NSData *uploadData = self.uploadData;
  if (uploadData) {
    // NSData provided.
    NSData *resultData;
    if (offset == 0 && length == (int64_t)uploadData.length) {
      resultData = uploadData;
    } else {
      int64_t dataLength = (int64_t)uploadData.length;
      // Ensure our range is valid.  b/18007814
      if (offset + length > dataLength) {
        NSString *errorMessage = [NSString stringWithFormat:
                                  @"Range invalid for upload data.  offset: %lld\tlength: %lld\tdataLength: %lld",
                                  offset, length, dataLength];
        GTMSESSION_ASSERT_DEBUG(NO, @"%@", errorMessage);
        response(nil,
                 kGTMSessionUploadFetcherUnknownFileSize,
                 [self uploadChunkUnavailableErrorWithDescription:errorMessage]);
        return;
      }
      NSRange range = NSMakeRange((NSUInteger)offset, (NSUInteger)length);

      @try {
        resultData = [uploadData subdataWithRange:range];
      }
      @catch (NSException *exception) {
        NSString *errorMessage = exception.description;
        GTMSESSION_ASSERT_DEBUG(NO, @"%@", errorMessage);
        response(nil,
                 kGTMSessionUploadFetcherUnknownFileSize,
                 [self uploadChunkUnavailableErrorWithDescription:errorMessage]);
        return;
      }
    }
    response(resultData, kGTMSessionUploadFetcherUnknownFileSize, nil);
    return;
  }
  NSURL *uploadFileURL = self.uploadFileURL;
  if (uploadFileURL) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      [self generateChunkSubdataFromFileURL:uploadFileURL
                                     offset:offset
                                     length:length
                                   response:response];
    });
    return;
  }
  GTMSESSION_ASSERT_DEBUG(_uploadFileHandle, @"Unexpectedly missing upload data package");
  NSFileHandle *uploadFileHandle = self.uploadFileHandle;
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    [self generateChunkSubdataFromFileHandle:uploadFileHandle
                                      offset:offset
                                      length:length
                                    response:response];
  });
}

- (void)generateChunkSubdataFromFileHandle:(NSFileHandle *)fileHandle
                                    offset:(int64_t)offset
                                    length:(int64_t)length
                                  response:(GTMSessionUploadFetcherDataProviderResponse)response {
  NSData *resultData;
  NSError *error;
  @try {
    [fileHandle seekToFileOffset:(unsigned long long)offset];
    resultData = [fileHandle readDataOfLength:(NSUInteger)length];
  }
  @catch (NSException *exception) {
    GTMSESSION_ASSERT_DEBUG(NO, @"uploadFileHandle failed to read, %@", exception);
    error = [self uploadChunkUnavailableErrorWithDescription:exception.description];
  }
  // The response always re-dispatches to the main thread, so we skip doing that here.
  response(resultData, kGTMSessionUploadFetcherUnknownFileSize, error);
}

- (void)generateChunkSubdataFromFileURL:(NSURL *)fileURL
                                 offset:(int64_t)offset
                                 length:(int64_t)length
                               response:(GTMSessionUploadFetcherDataProviderResponse)response {
  GTMSessionCheckNotSynchronized(self);

  NSData *resultData;
  NSError *error;
  int64_t fullUploadLength = [self fullUploadLength];
  NSData *mappedData =
      [NSData dataWithContentsOfURL:fileURL
                            options:NSDataReadingMappedAlways + NSDataReadingUncached
                              error:&error];
  if (!mappedData) {
    // We could not create an NSData by memory-mapping the file.
#if TARGET_IPHONE_SIMULATOR
    // NSTemporaryDirectory() can differ in the simulator between app restarts,
    // yet the contents for the new path remains unchanged, so try the latest temp path.
    if ([error.domain isEqual:NSCocoaErrorDomain] && (error.code == NSFileReadNoSuchFileError)) {
      NSString *filename = [fileURL lastPathComponent];
      NSString *filePath = [NSTemporaryDirectory() stringByAppendingPathComponent:filename];
      NSURL *newFileURL = [NSURL fileURLWithPath:filePath];
      if (![newFileURL isEqual:fileURL]) {
        [self generateChunkSubdataFromFileURL:newFileURL
                                       offset:offset
                                       length:length
                                     response:response];
        return;
      }
    }
#endif

    // If the file is just too large to create an NSData for, or if for some other reason we can't
    // map it, create an NSFileHandle instead to read a subset into an NSData.
#if DEBUG
    NSNumber *fileSizeNum;
    BOOL hasFileSize = [fileURL getResourceValue:&fileSizeNum forKey:NSURLFileSizeKey error:NULL];
    GTMSESSION_LOG_DEBUG(@"Note: uploadFileURL is falling back to creating upload chunks by reading"
                         @" an NSFileHandle since uploadFileURL failed to map the upload file,"
                         @" file size %@, %@",
                         hasFileSize ? fileSizeNum : @"unknown", error);
#endif

    NSFileHandle *fileHandle = [NSFileHandle fileHandleForReadingFromURL:fileURL
                                                                   error:&error];
    if (fileHandle != nil) {
      [self generateChunkSubdataFromFileHandle:fileHandle
                                        offset:offset
                                        length:length
                                      response:response];
      return;
    }
    GTMSESSION_ASSERT_DEBUG(NO, @"uploadFileURL failed to read, %@", error);
    // Fall through with the error.
  } else {
    // Successfully created an NSData by memory-mapping the file.
    if ((NSUInteger)(offset + length) > mappedData.length) {
      NSString *errorMessage = [NSString stringWithFormat:
                                @"Range invalid for upload data.  offset: %lld\tlength: %lld\tdataLength: %lld\texpected UploadLength: %lld",
                                offset, length, (long long)mappedData.length, fullUploadLength];
      GTMSESSION_ASSERT_DEBUG(NO, @"%@", errorMessage);
      response(nil,
               kGTMSessionUploadFetcherUnknownFileSize,
               [self uploadChunkUnavailableErrorWithDescription:errorMessage]);
      return;
    }
    if (offset > 0 || length < fullUploadLength) {
      NSRange range = NSMakeRange((NSUInteger)offset, (NSUInteger)length);
      resultData = [mappedData subdataWithRange:range];
    } else {
      resultData = mappedData;
    }
  }
  // The response always re-dispatches to the main thread, so we skip re-dispatching here.
  response(resultData, kGTMSessionUploadFetcherUnknownFileSize, error);
}

- (NSError *)uploadChunkUnavailableErrorWithDescription:(NSString *)description {
  // The description in the userInfo is intended as a clue to programmers, not
  // for client code to examine or rely on.
  NSDictionary *userInfo = @{ @"description" : description };
  return [NSError errorWithDomain:kGTMSessionFetcherErrorDomain
                             code:GTMSessionFetcherErrorUploadChunkUnavailable
                         userInfo:userInfo];
}

- (NSError *)prematureFailureErrorWithUserInfo:(NSDictionary *)userInfo {
  // An error for if we get an unexpected status from the upload server or
  // otherwise cannot continue.  This is an issue beyond the upload protocol;
  // there's no way the client can do anything useful except give up.
  NSError *error = [NSError errorWithDomain:kGTMSessionFetcherStatusDomain
                                       code:501  // Not implemented
                                   userInfo:userInfo];
  return error;
}

+ (GTMSessionUploadFetcherStatus)uploadStatusFromResponseHeaders:(NSDictionary *)responseHeaders {
  NSString *statusString = [responseHeaders objectForKey:kGTMSessionHeaderXGoogUploadStatus];
  if ([statusString isEqual:@"active"]) {
    return kStatusActive;
  }
  if ([statusString isEqual:@"final"]) {
    return kStatusFinal;
  }
  if ([statusString isEqual:@"cancelled"]) {
    return kStatusCancelled;
  }
  return kStatusUnknown;
}

#pragma mark Method overrides affecting the initial fetch only

- (void)setCompletionHandler:(GTMSessionFetcherCompletionHandler)handler {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _delegateCompletionHandler = handler;
  }
}

- (void)setDelegateCallbackQueue:(dispatch_queue_t GTM_NULLABLE_TYPE)queue {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _delegateCallbackQueue = queue;
  }
}

- (dispatch_queue_t GTM_NULLABLE_TYPE)delegateCallbackQueue {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _delegateCallbackQueue;
  }
}

- (BOOL)isRestartedUpload {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _isRestartedUpload;
  }
}

- (GTMSessionFetcher * GTM_NULLABLE_TYPE)chunkFetcher {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _chunkFetcher;
  }
}

- (void)setChunkFetcher:(GTMSessionFetcher * GTM_NULLABLE_TYPE)fetcher {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _chunkFetcher = fetcher;
  }
}

- (void)setFetcherInFlight:(GTMSessionFetcher * GTM_NULLABLE_TYPE)fetcher {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _fetcherInFlight = fetcher;
  }
}

- (GTMSessionFetcher * GTM_NULLABLE_TYPE)fetcherInFlight {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _fetcherInFlight;
  }
}

- (void)setCancellationHandler:(GTMSessionUploadFetcherCancellationHandler GTM_NULLABLE_TYPE)
    cancellationHandler {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _cancellationHandler = cancellationHandler;
  }
}

- (GTMSessionUploadFetcherCancellationHandler GTM_NULLABLE_TYPE)cancellationHandler {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _cancellationHandler;
  }
}

- (void)beginFetchForRetry {
  GTMSessionCheckNotSynchronized(self);

  // Override the superclass to reset the initial body length and fetcher-in-flight,
  // then call the superclass implementation.
  [self setInitialBodyLength:[self bodyLength]];

  GTMSESSION_ASSERT_DEBUG(self.fetcherInFlight == nil, @"unexpected fetcher in flight: %@",
                          self.fetcherInFlight);
  self.fetcherInFlight = self;
  [super beginFetchForRetry];
}

- (void)beginFetchWithCompletionHandler:(GTMSessionFetcherCompletionHandler)handler {
  GTMSessionCheckNotSynchronized(self);

  [self setInitialBodyLength:[self bodyLength]];

  // We'll hold onto the superclass's callback queue so we can invoke the handler
  // even after the superclass has released the queue and its callback handler, as
  // happens during auth failure.
  [self setDelegateCallbackQueue:self.callbackQueue];
  self.completionHandler = handler;

  if ([self isRestartedUpload]) {
    // When restarting an upload, we know the destination location for chunk fetches,
    // but we need to query to find the initial offset.
    if (![self isPaused]) {
      [self sendQueryForUploadOffsetWithFetcherProperties:self.properties];
    }
    return;
  }
  // We don't want to call into the client's completion block immediately
  // after the finish of the initial connection (the delegate is called only
  // when uploading finishes), so we substitute our own completion block to be
  // called when the initial connection finishes
  GTMSESSION_ASSERT_DEBUG(self.fetcherInFlight == nil, @"unexpected fetcher in flight: %@",
                          self.fetcherInFlight);

  self.fetcherInFlight = self;
  [super beginFetchWithCompletionHandler:^(NSData *data, NSError *error) {
    self.fetcherInFlight = nil;
    // callback

    BOOL hasTestBlock = (self.testBlock != nil);
    if (![self isRestartedUpload] && !hasTestBlock) {
      if (error == nil) {
        [self beginChunkFetches];
      } else {
        if ([self retryTimer] == nil) {
          [self invokeFinalCallbackWithData:nil
                                      error:error
                   shouldInvalidateLocation:YES];
        }
      }
    } else {
      // If there was no initial request, then this fetch is resuming some
      // other uploadFetcher's initial request, and the superclass's connection
      // is never used, so at this point we call the user's actual completion
      // block.
      if (!hasTestBlock) {
        [self invokeFinalCallbackWithData:data
                                    error:error
                 shouldInvalidateLocation:YES];
      } else {
        // There was a test block, so we won't do chunk fetches, but we simulate obtaining
        // the data to be uploaded from the upload data provider block or the file handle,
        // and then call back.
        [self generateChunkSubdataWithOffset:0
                                      length:[self fullUploadLength]
                                    response:^(NSData *generateData, int64_t fullUploadLength, NSError *generateError) {
            [self invokeFinalCallbackWithData:data
                                        error:error
                     shouldInvalidateLocation:YES];
        }];
      }
    }
  }];
}

- (void)beginChunkFetches {
  GTMSessionCheckNotSynchronized(self);

#if DEBUG
  // The initial response of the resumable upload protocol should have an
  // empty body
  //
  // This assert typically happens because the upload create/edit link URL was
  // not supplied with the request, and the server is thus expecting a non-
  // resumable request/response.
  if (self.downloadedData.length > 0) {
    NSData *downloadedData = self.downloadedData;
    NSString *str = [[NSString alloc] initWithData:downloadedData
                                          encoding:NSUTF8StringEncoding];
    #pragma unused(str)
    GTMSESSION_ASSERT_DEBUG(NO, @"unexpected response data (uploading to the wrong URL?)\n%@", str);
  }
#endif

  // We need to get the upload URL from the location header to continue.
  NSDictionary *responseHeaders = [self responseHeaders];

  [self retrieveUploadChunkGranularityFromResponseHeaders:responseHeaders];

  GTMSessionUploadFetcherStatus uploadStatus =
      [[self class] uploadStatusFromResponseHeaders:responseHeaders];
  GTMSESSION_ASSERT_DEBUG(uploadStatus != kStatusUnknown,
      @"beginChunkFetches has unexpected upload status for headers %@", responseHeaders);

  BOOL isPrematureStop = (uploadStatus == kStatusFinal) || (uploadStatus == kStatusCancelled);

  NSString *uploadLocationURLStr = [responseHeaders objectForKey:kGTMSessionHeaderXGoogUploadURL];
  BOOL hasUploadLocation = (uploadLocationURLStr.length > 0);

  if (isPrematureStop || !hasUploadLocation) {
    GTMSESSION_ASSERT_DEBUG(NO, @"Premature failure: upload-status:\"%@\"  location:%@",
        [responseHeaders objectForKey:kGTMSessionHeaderXGoogUploadStatus], uploadLocationURLStr);
    // We cannot continue since we do not know the location to use
    // as our upload destination.
    NSDictionary *userInfo = nil;
    NSData *downloadedData = self.downloadedData;
    if (downloadedData.length > 0) {
      userInfo = @{ kGTMSessionFetcherStatusDataKey : downloadedData };
    }
    NSError *failureError = [self prematureFailureErrorWithUserInfo:userInfo];
    [self invokeFinalCallbackWithData:nil
                                error:failureError
             shouldInvalidateLocation:YES];
    return;
  }

  self.uploadLocationURL = [NSURL URLWithString:uploadLocationURLStr];

  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc postNotificationName:kGTMSessionFetcherUploadLocationObtainedNotification
                    object:self];

  // we've now sent all of the initial post body data, so we need to include
  // its size in future progress indicator callbacks
  [self setInitialBodySent:[self initialBodyLength]];

  // just in case the user paused us during the initial fetch...
  if (![self isPaused]) {
    [self uploadNextChunkWithOffset:0];
  }
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
   didSendBodyData:(int64_t)bytesSent
    totalBytesSent:(int64_t)totalBytesSent
    totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend {
  // Overrides the superclass.
  [self invokeDelegateWithDidSendBytes:bytesSent
                        totalBytesSent:totalBytesSent
              totalBytesExpectedToSend:totalBytesExpectedToSend + [self fullUploadLength]];
}

- (BOOL)shouldReleaseCallbacksUponCompletion {
  // Overrides the superclass.

  // We don't want the superclass to release the delegate and callback
  // blocks once the initial fetch has finished
  //
  // This is invoked for only successful completion of the connection;
  // an error always will invoke and release the callbacks
  return NO;
}

- (void)invokeFinalCallbackWithData:(NSData *)data
                              error:(NSError *)error
           shouldInvalidateLocation:(BOOL)shouldInvalidateLocation {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (shouldInvalidateLocation) {
      _uploadLocationURL = nil;
    }

    dispatch_queue_t queue = _delegateCallbackQueue;
    GTMSessionFetcherCompletionHandler handler = _delegateCompletionHandler;
    if (queue && handler) {
      [self invokeOnCallbackQueue:queue
                 afterUserStopped:NO
                            block:^{
          handler(data, error);
      }];
    }
  }  // @synchronized(self)

  [self releaseUploadAndBaseCallbacks:!self.userStoppedFetching];
}

- (void)releaseUploadAndBaseCallbacks:(BOOL)shouldReleaseCancellation {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _delegateCallbackQueue = nil;
    _delegateCompletionHandler = nil;
    _uploadDataProvider = nil;
    if (shouldReleaseCancellation) {
      _cancellationHandler = nil;
    }
  }

  // Release the base class's callbacks, too, if needed.
  [self releaseCallbacks];
}

- (void)stopFetchReleasingCallbacks:(BOOL)shouldReleaseCallbacks {
  GTMSessionCheckNotSynchronized(self);

  // Clear _fetcherInFlight when stopped. Moved from stopFetching, since that's a public method,
  // where this method does the work. Fixes issue clearing value when retryBlock included.
  GTMSessionFetcher *fetcherInFlight = self.fetcherInFlight;
  if (fetcherInFlight == self) {
    self.fetcherInFlight = nil;
  }

  [super stopFetchReleasingCallbacks:shouldReleaseCallbacks];

  if (shouldReleaseCallbacks) {
    [self releaseUploadAndBaseCallbacks:NO];
  }
}

#pragma mark Chunk fetching methods

- (void)uploadNextChunkWithOffset:(int64_t)offset {
  // use the properties in each chunk fetcher
  NSDictionary *props = [self properties];

  [self uploadNextChunkWithOffset:offset
                fetcherProperties:props];
}

- (void)sendQueryForUploadOffsetWithFetcherProperties:(NSDictionary *)props {
  GTMSessionFetcher *queryFetcher = [self uploadFetcherWithProperties:props
                                                         isQueryFetch:YES];
  queryFetcher.bodyData = [NSData data];

  NSString *originalComment = self.comment;
  [queryFetcher setCommentWithFormat:@"%@ (query offset)",
   originalComment ? originalComment : @"upload"];

  [queryFetcher setRequestValue:@"query" forHTTPHeaderField:kGTMSessionHeaderXGoogUploadCommand];

  self.fetcherInFlight = queryFetcher;
  [queryFetcher beginFetchWithDelegate:self
                     didFinishSelector:@selector(queryFetcher:finishedWithData:error:)];
}

- (void)queryFetcher:(GTMSessionFetcher *)queryFetcher
    finishedWithData:(NSData *)data
               error:(NSError *)error {
  self.fetcherInFlight = nil;

  NSDictionary *responseHeaders = [queryFetcher responseHeaders];
  NSString *sizeReceivedHeader;

  GTMSessionUploadFetcherStatus uploadStatus =
      [[self class] uploadStatusFromResponseHeaders:responseHeaders];
  GTMSESSION_ASSERT_DEBUG(uploadStatus != kStatusUnknown || error != nil,
      @"query fetcher completion has unexpected upload status for headers %@", responseHeaders);

  if (error == nil) {
    sizeReceivedHeader = [responseHeaders objectForKey:kGTMSessionHeaderXGoogUploadSizeReceived];

    if (uploadStatus == kStatusCancelled ||
        (uploadStatus == kStatusActive && sizeReceivedHeader == nil)) {
      NSDictionary *userInfo = nil;
      if (data.length > 0) {
        userInfo = @{ kGTMSessionFetcherStatusDataKey : data };
      }
      error = [self prematureFailureErrorWithUserInfo:userInfo];
    }
  }

  if (error == nil) {
    int64_t offset = [sizeReceivedHeader longLongValue];
    int64_t fullUploadLength = [self fullUploadLength];
    if (uploadStatus == kStatusFinal ||
        (offset >= fullUploadLength &&
         fullUploadLength != kGTMSessionUploadFetcherUnknownFileSize)) {
      // Handle we're done
      [self chunkFetcher:queryFetcher finishedWithData:data error:nil];
    } else {
      [self retrieveUploadChunkGranularityFromResponseHeaders:responseHeaders];
      [self uploadNextChunkWithOffset:offset];
    }
  } else {
    // Handle query error
    [self chunkFetcher:queryFetcher finishedWithData:data error:error];
  }
}

- (void)sendCancelUploadWithFetcherProperties:(NSDictionary *)props {
  @synchronized(self) {
    _isCancelInFlight = YES;
  }
  GTMSessionFetcher *cancelFetcher = [self uploadFetcherWithProperties:props
                                                          isQueryFetch:YES];
  cancelFetcher.bodyData = [NSData data];

  NSString *originalComment = self.comment;
  [cancelFetcher setCommentWithFormat:@"%@ (cancel)",
      originalComment ? originalComment : @"upload"];

  [cancelFetcher setRequestValue:@"cancel" forHTTPHeaderField:kGTMSessionHeaderXGoogUploadCommand];

  self.fetcherInFlight = cancelFetcher;
  [cancelFetcher beginFetchWithCompletionHandler:^(NSData *data, NSError *error) {
      self.fetcherInFlight = nil;
      if (![self triggerCancellationHandlerForFetch:cancelFetcher data:data error:error]) {
        if (error) {
          GTMSESSION_LOG_DEBUG(@"cancelFetcher %@", error);
        }
      }
      @synchronized(self) {
        self->_isCancelInFlight = NO;
      }
  }];
}

- (void)uploadNextChunkWithOffset:(int64_t)offset
                fetcherProperties:(NSDictionary *)props {
  GTMSessionCheckNotSynchronized(self);

  // Example chunk headers:
  //  X-Goog-Upload-Command: upload, finalize
  //  X-Goog-Upload-Offset: 0
  //  Content-Length: 2000000
  //  Content-Type: image/jpeg
  //
  //  {bytes 0-1999999}

  // The chunk upload URL requires no authentication header.
  GTMSessionFetcher *chunkFetcher = [self uploadFetcherWithProperties:props
                                                         isQueryFetch:NO];
  [self attachSendProgressBlockToChunkFetcher:chunkFetcher];
  int64_t chunkSize = [self updateChunkFetcher:chunkFetcher
                              forChunkAtOffset:offset];
  BOOL isUploadingFileURL = (self.uploadFileURL != nil);
  int64_t fullUploadLength = [self fullUploadLength];

  // The chunk size may have changed, so determine again if we're uploading the full file.
  BOOL isUploadingFullFile = (offset == 0 &&
                              fullUploadLength != kGTMSessionUploadFetcherUnknownFileSize &&
                              chunkSize >= fullUploadLength);
  if (isUploadingFullFile && isUploadingFileURL) {
    // The data is the full upload file URL.
    chunkFetcher.bodyFileURL = self.uploadFileURL;
    [self beginChunkFetcher:chunkFetcher
                     offset:offset];
  } else {
    // Make an NSData for the subset for this upload chunk.
    self.subdataGenerating = YES;
    [self generateChunkSubdataWithOffset:offset
                                  length:chunkSize
                                response:^(NSData *chunkData, int64_t uploadFileLength, NSError *chunkError) {
      // The subdata methods may leave us on a background thread.
      dispatch_async(dispatch_get_main_queue(), ^{
        self.subdataGenerating = NO;

        // dont allow the updating of fileLength for uploads not using a data provider as they
        // should know the file length before the upload starts.
        if (self->_uploadDataProvider != nil && uploadFileLength > 0) {
          [self setUploadFileLength:uploadFileLength];
          // Update the command and content-length headers if this is the last chunk to be sent.
          if (offset + chunkSize >= uploadFileLength) {
            int64_t updatedChunkSize = [self updateChunkFetcher:chunkFetcher
                                               forChunkAtOffset:offset];
            if (updatedChunkSize == 0) {
              // Calling beginChunkFetcher early when there is no more data to send allows us to
              // properly handle nil chunkData below without having to account for the case where
              // we are just finalizing the file.
              chunkFetcher.bodyData = [[NSData alloc] init];
              [self beginChunkFetcher:chunkFetcher
                               offset:offset];
              return;
            }
          }
        }

        if (chunkData == nil) {
          NSError *responseError = chunkError;
          if (!responseError) {
            responseError = [self uploadChunkUnavailableErrorWithDescription:@"chunkData is nil"];
          }
          [self invokeFinalCallbackWithData:nil
                                      error:responseError
                   shouldInvalidateLocation:YES];
          return;
        }

        BOOL didWriteFile = NO;
        if (isUploadingFileURL) {
          // Make a temporary file with the data subset.
          NSString *tempName =
              [NSString stringWithFormat:@"GTMUpload_temp_%@", [[NSUUID UUID] UUIDString]];
          NSString *tempPath = [NSTemporaryDirectory() stringByAppendingPathComponent:tempName];
          NSError *writeError;
          didWriteFile = [chunkData writeToFile:tempPath
                                        options:NSDataWritingAtomic
                                          error:&writeError];
          if (didWriteFile) {
            chunkFetcher.bodyFileURL = [NSURL fileURLWithPath:tempPath];
          } else {
            GTMSESSION_LOG_DEBUG(@"writeToFile failed: %@\n%@", writeError, tempPath);
          }
        }
        if (!didWriteFile) {
          chunkFetcher.bodyData = [chunkData copy];
        }
        [self beginChunkFetcher:chunkFetcher
                         offset:offset];
      });
    }];
  }
}

- (void)beginChunkFetcher:(GTMSessionFetcher *)chunkFetcher
                   offset:(int64_t)offset {

  // Track the current offset for progress reporting
  self.currentOffset = offset;

  // Hang on to the fetcher in case we need to cancel it.  We set these before beginning the
  // chunk fetch so the observers notified of chunk fetches can inspect the upload fetcher to
  // match to the chunk.
  self.chunkFetcher = chunkFetcher;
  self.fetcherInFlight = chunkFetcher;

  // Update the last chunk request, including any request headers.
  self.lastChunkRequest = chunkFetcher.request;

  [chunkFetcher beginFetchWithDelegate:self
                     didFinishSelector:@selector(chunkFetcher:finishedWithData:error:)];
}

- (void)attachSendProgressBlockToChunkFetcher:(GTMSessionFetcher *)chunkFetcher {
  chunkFetcher.sendProgressBlock = ^(int64_t bytesSent, int64_t totalBytesSent,
                                     int64_t totalBytesExpectedToSend) {
    // The total bytes expected include the initial body and the full chunked
    // data, independent of how big this fetcher's chunk is.
    int64_t initialBodySent = [self bodyLength];  // TODO(grobbins) use [self initialBodySent]
    int64_t totalSent = initialBodySent + self.currentOffset + totalBytesSent;
    int64_t totalExpected = initialBodySent + [self fullUploadLength];

    [self invokeDelegateWithDidSendBytes:bytesSent
                          totalBytesSent:totalSent
                totalBytesExpectedToSend:totalExpected];
  };
}

- (NSDictionary *)uploadSessionIdentifierMetadata {
  NSMutableDictionary *metadata = [NSMutableDictionary dictionary];
  metadata[kGTMSessionIdentifierIsUploadChunkFetcherMetadataKey] = @YES;
  GTMSESSION_ASSERT_DEBUG(self.uploadFileURL,
                          @"Invalid upload fetcher to create session identifier for metadata");
  metadata[kGTMSessionIdentifierUploadFileURLMetadataKey] = [self.uploadFileURL absoluteString];
  metadata[kGTMSessionIdentifierUploadFileLengthMetadataKey] = @([self fullUploadLength]);

  if (self.uploadLocationURL) {
    metadata[kGTMSessionIdentifierUploadLocationURLMetadataKey] =
        [self.uploadLocationURL absoluteString];
  }
  if (self.uploadMIMEType) {
    metadata[kGTMSessionIdentifierUploadMIMETypeMetadataKey] = self.uploadMIMEType;
  }
  metadata[kGTMSessionIdentifierUploadChunkSizeMetadataKey] = @(self.chunkSize);
  metadata[kGTMSessionIdentifierUploadCurrentOffsetMetadataKey] = @(self.currentOffset);
  return metadata;
}

- (GTMSessionFetcher *)uploadFetcherWithProperties:(NSDictionary *)properties
                                      isQueryFetch:(BOOL)isQueryFetch {
  GTMSessionCheckNotSynchronized(self);

  // Common code to make a request for a query command or for a chunk upload.
  NSURL *uploadLocationURL = self.uploadLocationURL;
  NSMutableURLRequest *chunkRequest = [NSMutableURLRequest requestWithURL:uploadLocationURL];
  [chunkRequest setHTTPMethod:@"PUT"];

  // copy the user-agent from the original connection
  // n.b. that self.request is nil for upload fetchers created with an existing upload location
  // URL.
  NSURLRequest *origRequest = self.request;
  NSString *userAgent = [origRequest valueForHTTPHeaderField:@"User-Agent"];
  if (userAgent.length > 0) {
    [chunkRequest setValue:userAgent forHTTPHeaderField:@"User-Agent"];
  }

  [chunkRequest setValue:kGTMSessionXGoogUploadProtocolResumable
      forHTTPHeaderField:kGTMSessionHeaderXGoogUploadProtocol];

  // To avoid timeouts when debugging, copy the timeout of the initial fetcher.
  NSTimeInterval origTimeout = [origRequest timeoutInterval];
  [chunkRequest setTimeoutInterval:origTimeout];

  //
  // Make a new chunk fetcher.
  //
  GTMSessionFetcher *chunkFetcher = [GTMSessionFetcher fetcherWithRequest:chunkRequest];
  chunkFetcher.callbackQueue = self.callbackQueue;
  chunkFetcher.sessionUserInfo = self.sessionUserInfo;
  chunkFetcher.configurationBlock = self.configurationBlock;
  chunkFetcher.allowedInsecureSchemes = self.allowedInsecureSchemes;
  chunkFetcher.allowLocalhostRequest = self.allowLocalhostRequest;
  chunkFetcher.allowInvalidServerCertificates = self.allowInvalidServerCertificates;
  chunkFetcher.useUploadTask = !isQueryFetch;

  if (self.uploadFileURL && !isQueryFetch && self.useBackgroundSession) {
    [chunkFetcher createSessionIdentifierWithMetadata:[self uploadSessionIdentifierMetadata]];
  }

  // Give the chunk fetcher the same properties as the previous chunk fetcher
  chunkFetcher.properties = [properties mutableCopy];
  [chunkFetcher setProperty:[NSValue valueWithNonretainedObject:self]
                     forKey:kGTMSessionUploadFetcherChunkParentKey];

  // copy other fetcher settings to the new fetcher
  chunkFetcher.retryEnabled = self.retryEnabled;
  chunkFetcher.maxRetryInterval = self.maxRetryInterval;

  if ([self isRetryEnabled]) {
    // We interpose our own retry method both so we can change the request to ask the server to
    // tell us where to resume the chunk.
    chunkFetcher.retryBlock = ^(BOOL suggestedWillRetry, NSError *chunkError,
                                GTMSessionFetcherRetryResponse response) {
      void (^finish)(BOOL) = ^(BOOL shouldRetry){
        // We'll retry by sending an offset query.
        if (shouldRetry) {
          self.shouldInitiateOffsetQuery = !isQueryFetch;

          // We don't know what our actual offset is anymore, but the server will tell us.
          self.currentOffset = 0;
        }
        // We don't actually want to retry this specific fetcher.
        response(NO);
      };

      GTMSessionFetcherRetryBlock retryBlock = self.retryBlock;
      if (retryBlock) {
        // Ask the client, then call the finish block above.
        retryBlock(suggestedWillRetry, chunkError, finish);
      } else {
        finish(suggestedWillRetry);
      }
    };
  }

  return chunkFetcher;
}

- (void)chunkFetcher:(GTMSessionFetcher *)chunkFetcher
    finishedWithData:(NSData *)data
               error:(NSError *)error {
  BOOL hasDestroyedOldChunkFetcher = NO;
  self.fetcherInFlight = nil;

  NSDictionary *responseHeaders = [chunkFetcher responseHeaders];
  GTMSessionUploadFetcherStatus uploadStatus =
      [[self class] uploadStatusFromResponseHeaders:responseHeaders];
  GTMSESSION_ASSERT_DEBUG(uploadStatus != kStatusUnknown
                          || error != nil
                          || self.wasCreatedFromBackgroundSession,
      @"chunk fetcher completion has kStatusUnknown upload status for headers %@ fetcher %@",
      responseHeaders, self);
  BOOL isUploadStatusStopped = (uploadStatus == kStatusFinal || uploadStatus == kStatusCancelled);

  // Check if the fetcher was actually querying. If it failed, do not retry,
  // as it would enter an infinite retry loop.
  NSString *uploadCommand =
      chunkFetcher.request.allHTTPHeaderFields[kGTMSessionHeaderXGoogUploadCommand];
  BOOL isQueryFetch = [uploadCommand isEqual:@"query"];

  // TODO
  // Maybe here we can check to see if the request had x goog content length set. (the file length one).
  int64_t previousContentLength =
      [[chunkFetcher.request valueForHTTPHeaderField:@"Content-Length"] longLongValue];
  // The Content-Length header may not be present if the chunk fetcher was recreated from
  // a background session.
  BOOL hasKnownChunkSize = (previousContentLength > 0);
  BOOL needsQuery = (!hasKnownChunkSize && !isUploadStatusStopped);

  if (error || (needsQuery && !isQueryFetch)) {
    NSInteger status = error.code;

    // Status 4xx indicates a bad offset in the Google upload protocol. However, do not retry status
    // 404 per spec, nor if the upload size appears to have been zero (since the server will just
    // keep asking us to retry.)
    if (self.shouldInitiateOffsetQuery ||
        (needsQuery && !isQueryFetch) ||
        ([error.domain isEqual:kGTMSessionFetcherStatusDomain] &&
         status >= 400 && status <= 499 &&
         status != 404 &&
         uploadStatus == kStatusActive &&
         previousContentLength > 0)) {
      self.shouldInitiateOffsetQuery = NO;
      [self destroyChunkFetcher];
      hasDestroyedOldChunkFetcher = YES;
      [self sendQueryForUploadOffsetWithFetcherProperties:chunkFetcher.properties];
    } else {
      // Some unexpected status has occurred; handle it as we would a regular
      // object fetcher failure.
      [self invokeFinalCallbackWithData:data
                                  error:error
               shouldInvalidateLocation:NO];
    }
  } else {
    // The chunk has uploaded successfully.
    int64_t newOffset = self.currentOffset + previousContentLength;
#if DEBUG
    // Verify that if we think all of the uploading data has been sent, the server responded with
    // the "final" upload status.
    BOOL hasUploadAllData = (newOffset == [self fullUploadLength]);
    BOOL isFinalStatus = (uploadStatus == kStatusFinal);
    #pragma unused(hasUploadAllData,isFinalStatus)
    GTMSESSION_ASSERT_DEBUG(hasUploadAllData == isFinalStatus || !hasKnownChunkSize,
                            @"uploadStatus:%@  newOffset:%lld (%lld + %lld)  fullUploadLength:%lld"
                            @" chunkFetcher:%@ requestHeaders:%@ responseHeaders:%@",
                            [responseHeaders objectForKey:kGTMSessionHeaderXGoogUploadStatus],
                            newOffset, self.currentOffset, previousContentLength,
                            [self fullUploadLength],
                            chunkFetcher, chunkFetcher.request.allHTTPHeaderFields,
                            responseHeaders);
#endif
    if (isUploadStatusStopped || (_currentOffset > _uploadFileLength && _uploadFileLength > 0)) {
      // This was the last chunk.
      if (error == nil && uploadStatus == kStatusCancelled) {
        // Report cancelled status as an error.
        NSDictionary *userInfo = nil;
        if (data.length > 0) {
          userInfo = @{ kGTMSessionFetcherStatusDataKey : data };
        }
        data = nil;
        error = [self prematureFailureErrorWithUserInfo:userInfo];
      } else {
        // The upload is in final status.
        //
        // Take the chunk fetcher's data as the superclass data.
        self.downloadedData = data;
        self.statusCode = chunkFetcher.statusCode;
      }

      // we're done
      [self invokeFinalCallbackWithData:data
                                  error:error
               shouldInvalidateLocation:YES];
    } else {
      // Start the next chunk.
      self.currentOffset = newOffset;

      // We want to destroy this chunk fetcher before creating the next one, but
      // we want to pass on its properties
      NSDictionary *props = [chunkFetcher properties];

      // We no longer need to be able to cancel this chunkFetcher.  Destroy it
      // before we create a new chunk fetcher.
      [self destroyChunkFetcher];
      hasDestroyedOldChunkFetcher = YES;

      [self uploadNextChunkWithOffset:newOffset
                    fetcherProperties:props];
    }
  }
  if (!hasDestroyedOldChunkFetcher) {
    [self destroyChunkFetcher];
  }
}

- (void)destroyChunkFetcher {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_fetcherInFlight == _chunkFetcher) {
      _fetcherInFlight = nil;
    }

    [_chunkFetcher stopFetching];

    NSURL *chunkFileURL = _chunkFetcher.bodyFileURL;
    BOOL wasTemporaryUploadFile = ![chunkFileURL isEqual:_uploadFileURL];
    if (wasTemporaryUploadFile) {
      NSError *error;
      [[NSFileManager defaultManager] removeItemAtURL:chunkFileURL
                                                error:&error];
      if (error) {
        GTMSESSION_LOG_DEBUG(@"removingItemAtURL failed: %@\n%@", error, chunkFileURL);
      }
    }

    _recentChunkReponseHeaders = _chunkFetcher.responseHeaders;

    // To avoid retain cycles, remove all properties except the parent identifier.
    _chunkFetcher.properties =
        @{ kGTMSessionUploadFetcherChunkParentKey : [NSValue valueWithNonretainedObject:self] };

    _chunkFetcher.retryBlock = nil;
    _chunkFetcher.sendProgressBlock = nil;
    _chunkFetcher = nil;
  }  // @synchronized(self)
}

// This method calculates the proper values to pass to the client's send progress block.
//
// The actual total bytes sent include the initial body sent, plus the
// offset into the batched data prior to the current chunk fetcher

- (void)invokeDelegateWithDidSendBytes:(int64_t)bytesSent
                        totalBytesSent:(int64_t)totalBytesSent
              totalBytesExpectedToSend:(int64_t)totalBytesExpected {
  GTMSessionCheckNotSynchronized(self);

  // Ensure the chunk fetcher survives the callback in case the user pauses the upload process.
  __block GTMSessionFetcher *holdFetcher = self.chunkFetcher;

  [self invokeOnCallbackQueue:self.delegateCallbackQueue
             afterUserStopped:NO
                        block:^{
      GTMSessionFetcherSendProgressBlock sendProgressBlock = self.sendProgressBlock;
      if (sendProgressBlock) {
        sendProgressBlock(bytesSent, totalBytesSent, totalBytesExpected);
      }
      holdFetcher = nil;
  }];
}

- (void)retrieveUploadChunkGranularityFromResponseHeaders:(NSDictionary *)responseHeaders {
  GTMSessionCheckNotSynchronized(self);

  // Standard granularity for Google uploads is 256K.
  NSString *chunkGranularityHeader =
      [responseHeaders objectForKey:kGTMSessionHeaderXGoogUploadChunkGranularity];
  self.uploadGranularity = chunkGranularityHeader.longLongValue;
}

#pragma mark -

- (BOOL)isPaused {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _isPaused;
  }  // @synchronized(self)
}

- (void)pauseFetching {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _isPaused = YES;
  }  // @synchronized(self)

  // Pausing just means stopping the current chunk from uploading;
  // when we resume, we will send a query request to the server to
  // figure out what bytes to resume sending.
  //
  // We won't try to cancel the initial data upload, but rather will check
  // for being paused in beginChunkFetches.
  [self destroyChunkFetcher];
}

- (void)resumeFetching {
  BOOL wasPaused;

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    wasPaused = _isPaused;
    _isPaused = NO;
  }  // @synchronized(self)

  if (wasPaused) {
    [self sendQueryForUploadOffsetWithFetcherProperties:self.properties];
  }
}

- (void)stopFetching {
  // Overrides the superclass
  [self destroyChunkFetcher];

  // If we think the server is waiting for more data, then tell it there won't be more.
  if (self.uploadLocationURL) {
    [self sendCancelUploadWithFetcherProperties:[self properties]];
    self.uploadLocationURL = nil;
  } else {
    [self invokeOnCallbackQueue:self.callbackQueue
               afterUserStopped:YES
                          block:^{
      // Repeated calls to stopFetching may cause this path to be reached despite having sent a real
      // cancel request, check here to ensure that the cancellation handler invocation which fires
      // will definitely be for the real request sent previously.
      @synchronized(self) {
        if (self->_isCancelInFlight) {
          return;
        }
      }
      [self triggerCancellationHandlerForFetch:nil data:nil error:nil];
    }];
  }

  [super stopFetching];
}

// Fires the cancellation handler, returning whether there was a handler to be fired.
- (BOOL)triggerCancellationHandlerForFetch:(GTMSessionFetcher *)fetcher
                                      data:(NSData *)data
                                     error:(NSError *)error {
  GTMSessionUploadFetcherCancellationHandler handler = self.cancellationHandler;
  if (handler) {
    handler(fetcher, data, error);
    self.cancellationHandler = nil;
    return YES;
  }
  return NO;
}

#pragma mark -

- (int64_t)updateChunkFetcher:(GTMSessionFetcher *)chunkFetcher
             forChunkAtOffset:(int64_t)offset {
  BOOL isUploadingFileURL = (self.uploadFileURL != nil);

  // Upload another chunk, meeting server-required granularity.
  int64_t chunkSize = self.chunkSize;

  int64_t fullUploadLength = [self fullUploadLength];
  BOOL isFileLengthKnown = fullUploadLength >= 0;

  BOOL isUploadingFullFile = (offset == 0 && isFileLengthKnown && chunkSize >= fullUploadLength);
  if (!isUploadingFileURL || !isUploadingFullFile) {
    // We're not uploading the entire file and given the file URL.  Since we'll be
    // allocating a subdata block for a chunk, we need to bound it to something that
    // won't blow the process's memory.
    if (chunkSize > kGTMSessionUploadFetcherMaximumDemandBufferSize) {
      chunkSize = kGTMSessionUploadFetcherMaximumDemandBufferSize;
    }
  }

  int64_t granularity = self.uploadGranularity;
  if (granularity > 0) {
    if (chunkSize < granularity) {
      chunkSize = granularity;
    } else {
      chunkSize = chunkSize - (chunkSize % granularity);
    }
  }

  GTMSESSION_ASSERT_DEBUG(offset < fullUploadLength || fullUploadLength == 0,
                          @"offset %lld exceeds data length %lld", offset, fullUploadLength);

  if (granularity > 0) {
    offset = offset - (offset % granularity);
  }

  // If the chunk size is bigger than the remaining data, or else
  // it's close enough in size to the remaining data that we'd rather
  // avoid having a whole extra http fetch for the leftover bit, then make
  // this chunk size exactly match the remaining data size
  NSString *command;
  int64_t thisChunkSize = chunkSize;

  BOOL isChunkTooBig = (thisChunkSize >= (fullUploadLength - offset));
  BOOL isChunkAlmostBigEnough = (fullUploadLength - offset - 2500 < thisChunkSize);
  BOOL isFinalChunk = (isChunkTooBig || isChunkAlmostBigEnough) && isFileLengthKnown;
  if (isFinalChunk) {
    thisChunkSize = fullUploadLength - offset;
    if (thisChunkSize > 0) {
      command = @"upload, finalize";
    } else {
      command = @"finalize";
    }
  } else {
    command = @"upload";
  }
  NSString *lengthStr = @(thisChunkSize).stringValue;
  NSString *offsetStr = @(offset).stringValue;

  [chunkFetcher setRequestValue:command forHTTPHeaderField:kGTMSessionHeaderXGoogUploadCommand];
  [chunkFetcher setRequestValue:lengthStr forHTTPHeaderField:@"Content-Length"];
  [chunkFetcher setRequestValue:offsetStr forHTTPHeaderField:kGTMSessionHeaderXGoogUploadOffset];
  if (_uploadFileLength != kGTMSessionUploadFetcherUnknownFileSize) {
    [chunkFetcher setRequestValue:@([self fullUploadLength]).stringValue
               forHTTPHeaderField:kGTMSessionHeaderXGoogUploadContentLength];
  }

  // Append the range of bytes in this chunk to the fetcher comment.
  NSString *baseComment = self.comment;
  [chunkFetcher setCommentWithFormat:@"%@ (%lld-%lld)",
      baseComment ? baseComment : @"upload", offset, MAX(0, offset + thisChunkSize - 1)];

  return thisChunkSize;
}

// Public properties.
@synthesize currentOffset = _currentOffset,
            delegateCompletionHandler = _delegateCompletionHandler,
            chunkFetcher = _chunkFetcher,
            lastChunkRequest = _lastChunkRequest,
            subdataGenerating = _subdataGenerating,
            shouldInitiateOffsetQuery = _shouldInitiateOffsetQuery,
            uploadGranularity = _uploadGranularity;

// Internal properties.
@dynamic fetcherInFlight;
@dynamic activeFetcher;
@dynamic statusCode;
@dynamic delegateCallbackQueue;

+ (void)removePointer:(void *)pointer fromPointerArray:(NSPointerArray *)pointerArray {
  for (NSUInteger index = 0, count = pointerArray.count; index < count; ++index) {
    void *pointerAtIndex = [pointerArray pointerAtIndex:index];
    if (pointerAtIndex == pointer) {
      [pointerArray removePointerAtIndex:index];
      return;
    }
  }
}

- (BOOL)useBackgroundSession {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _useBackgroundSessionOnChunkFetchers;
  }  // @synchronized(self
}

- (void)setUseBackgroundSession:(BOOL)useBackgroundSession {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_useBackgroundSessionOnChunkFetchers != useBackgroundSession) {
      _useBackgroundSessionOnChunkFetchers = useBackgroundSession;
      NSPointerArray *uploadFetcherPointerArrayForBackgroundSessions =
          [[self class] uploadFetcherPointerArrayForBackgroundSessions];
      @synchronized(uploadFetcherPointerArrayForBackgroundSessions) {
        if (_useBackgroundSessionOnChunkFetchers) {
          [uploadFetcherPointerArrayForBackgroundSessions addPointer:(__bridge void *)self];
        } else {
          [[self class] removePointer:(__bridge void *)self
                     fromPointerArray:uploadFetcherPointerArrayForBackgroundSessions];
        }
      }  // @synchronized(uploadFetcherPointerArrayForBackgroundSessions)
    }
  }  // @synchronized(self)
}

- (BOOL)canFetchWithBackgroundSession {
  // The initial upload fetcher is always a foreground session; the
  // useBackgroundSession property will apply only to chunk fetchers,
  // not to queries.
  return NO;
}

- (NSDictionary *)responseHeaders {
  GTMSessionCheckNotSynchronized(self);
  // Overrides the superclass

  // If asked for the fetcher's response, use the most recent chunk fetcher's response,
  // since the original request's response lacks useful information like the actual
  // Content-Type.
  NSDictionary *dict = self.chunkFetcher.responseHeaders;
  if (dict) {
    return dict;
  }

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_recentChunkReponseHeaders) {
      return _recentChunkReponseHeaders;
    }
  }  // @synchronized(self

  // No chunk fetcher yet completed, so return whatever we have from the initial fetch.
  return [super responseHeaders];
}

- (NSInteger)statusCodeUnsynchronized {
  GTMSessionCheckSynchronized(self);

  if (_recentChunkStatusCode != -1) {
    // Overrides the superclass to indicate status appropriate to the initial
    // or latest chunk fetch
    return _recentChunkStatusCode;
  } else {
    return [super statusCodeUnsynchronized];
  }
}


- (void)setStatusCode:(NSInteger)val {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _recentChunkStatusCode = val;
  }
}

- (int64_t)initialBodyLength {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _initialBodyLength;
  }
}

- (void)setInitialBodyLength:(int64_t)length {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _initialBodyLength = length;
  }
}

- (int64_t)initialBodySent {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _initialBodySent;
  }
}

- (void)setInitialBodySent:(int64_t)length {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _initialBodySent = length;
  }
}

- (NSURL *)uploadLocationURL {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _uploadLocationURL;
  }
}

- (void)setUploadLocationURL:(NSURL *)locationURL {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _uploadLocationURL = locationURL;
  }
}

- (GTMSessionFetcher *)activeFetcher {
  GTMSessionFetcher *result = self.fetcherInFlight;
  if (result) return result;

  return self;
}

- (BOOL)isFetching {
  // If there is an active chunk fetcher, then the upload fetcher is considered
  // to still be fetching.
  if (self.fetcherInFlight != nil) return YES;

  return [super isFetching];
}

- (BOOL)waitForCompletionWithTimeout:(NSTimeInterval)timeoutInSeconds {
  NSDate *timeoutDate = [NSDate dateWithTimeIntervalSinceNow:timeoutInSeconds];

  while (self.fetcherInFlight || self.subdataGenerating) {
    if ([timeoutDate timeIntervalSinceNow] < 0) return NO;

    if (self.subdataGenerating) {
      // Allow time for subdata generation.
      NSDate *stopDate = [NSDate dateWithTimeIntervalSinceNow:0.001];
      [[NSRunLoop currentRunLoop] runUntilDate:stopDate];
    } else {
      // Wait for any chunk or query fetchers that still have pending callbacks or
      // notifications.
      BOOL timedOut;

      if (self.fetcherInFlight == self) {
        timedOut = ![super waitForCompletionWithTimeout:timeoutInSeconds];
      } else {
        timedOut = ![self.fetcherInFlight waitForCompletionWithTimeout:timeoutInSeconds];
      }
      if (timedOut) return NO;
    }
  }
  return YES;
}

@end

@implementation GTMSessionFetcher (GTMSessionUploadFetcherMethods)

- (GTMSessionUploadFetcher *)parentUploadFetcher {
  NSValue *property = [self propertyForKey:kGTMSessionUploadFetcherChunkParentKey];
  if (!property) return nil;

  GTMSessionUploadFetcher *uploadFetcher = property.nonretainedObjectValue;

  GTMSESSION_ASSERT_DEBUG([uploadFetcher isKindOfClass:[GTMSessionUploadFetcher class]],
                          @"Unexpected parent upload fetcher class: %@", [uploadFetcher class]);
  return uploadFetcher;
}

@end
