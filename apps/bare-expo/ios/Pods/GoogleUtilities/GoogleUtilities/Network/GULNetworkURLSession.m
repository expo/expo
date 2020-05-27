// Copyright 2017 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import <Foundation/Foundation.h>

#import "GoogleUtilities/Network/Private/GULNetworkURLSession.h"

#import <GoogleUtilities/GULLogger.h>
#import "GoogleUtilities/Network/Private/GULMutableDictionary.h"
#import "GoogleUtilities/Network/Private/GULNetworkConstants.h"
#import "GoogleUtilities/Network/Private/GULNetworkMessageCode.h"

@interface GULNetworkURLSession () <NSURLSessionDelegate,
                                    NSURLSessionDataDelegate,
                                    NSURLSessionDownloadDelegate,
                                    NSURLSessionTaskDelegate>
@end

@implementation GULNetworkURLSession {
  /// The handler to be called when the request completes or error has occurs.
  GULNetworkURLSessionCompletionHandler _completionHandler;

  /// Session ID generated randomly with a fixed prefix.
  NSString *_sessionID;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability"
  /// The session configuration. NSURLSessionConfiguration' is only available on iOS 7.0 or newer.
  NSURLSessionConfiguration *_sessionConfig;

  /// The current NSURLSession.
  NSURLSession *__weak _Nullable _URLSession;
#pragma clang diagnostic pop

  /// The path to the directory where all temporary files are stored before uploading.
  NSURL *_networkDirectoryURL;

  /// The downloaded data from fetching.
  NSData *_downloadedData;

  /// The path to the temporary file which stores the uploading data.
  NSURL *_uploadingFileURL;

  /// The current request.
  NSURLRequest *_request;
}

#pragma mark - Init

- (instancetype)initWithNetworkLoggerDelegate:(id<GULNetworkLoggerDelegate>)networkLoggerDelegate {
  self = [super init];
  if (self) {
    // Create URL to the directory where all temporary files to upload have to be stored.
    NSArray *paths =
        NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES);
    NSString *applicationSupportDirectory = paths.firstObject;
    NSArray *tempPathComponents = @[
      applicationSupportDirectory, kGULNetworkApplicationSupportSubdirectory,
      kGULNetworkTempDirectoryName
    ];
    _networkDirectoryURL = [NSURL fileURLWithPathComponents:tempPathComponents];
    _sessionID = [NSString stringWithFormat:@"%@-%@", kGULNetworkBackgroundSessionConfigIDPrefix,
                                            [[NSUUID UUID] UUIDString]];
    _loggerDelegate = networkLoggerDelegate;
  }
  return self;
}

#pragma mark - External Methods

#pragma mark - To be called from AppDelegate

+ (void)handleEventsForBackgroundURLSessionID:(NSString *)sessionID
                            completionHandler:
                                (GULNetworkSystemCompletionHandler)systemCompletionHandler {
  // The session may not be Analytics background. Ignore those that do not have the prefix.
  if (![sessionID hasPrefix:kGULNetworkBackgroundSessionConfigIDPrefix]) {
    return;
  }
  GULNetworkURLSession *fetcher = [self fetcherWithSessionIdentifier:sessionID];
  if (fetcher != nil) {
    [fetcher addSystemCompletionHandler:systemCompletionHandler forSession:sessionID];
  } else {
    GULLogError(kGULLoggerNetwork, NO,
                [NSString stringWithFormat:@"I-NET%06ld", (long)kGULNetworkMessageCodeNetwork003],
                @"Failed to retrieve background session with ID %@ after app is relaunched.",
                sessionID);
  }
}

#pragma mark - External Methods

/// Sends an async POST request using NSURLSession for iOS >= 7.0, and returns an ID of the
/// connection.
- (nullable NSString *)sessionIDFromAsyncPOSTRequest:(NSURLRequest *)request
                                   completionHandler:(GULNetworkURLSessionCompletionHandler)handler
    API_AVAILABLE(ios(7.0)) {
  // NSURLSessionUploadTask does not work with NSData in the background.
  // To avoid this issue, write the data to a temporary file to upload it.
  // Make a temporary file with the data subset.
  _uploadingFileURL = [self temporaryFilePathWithSessionID:_sessionID];
  NSError *writeError;
  NSURLSessionUploadTask *postRequestTask;
  NSURLSession *session;
  BOOL didWriteFile = NO;

  // Clean up the entire temp folder to avoid temp files that remain in case the previous session
  // crashed and did not clean up.
  [self maybeRemoveTempFilesAtURL:_networkDirectoryURL
                     expiringTime:kGULNetworkTempFolderExpireTime];

  // If there is no background network enabled, no need to write to file. This will allow default
  // network session which runs on the foreground.
  if (_backgroundNetworkEnabled && [self ensureTemporaryDirectoryExists]) {
    didWriteFile = [request.HTTPBody writeToFile:_uploadingFileURL.path
                                         options:NSDataWritingAtomic
                                           error:&writeError];

    if (writeError) {
      [_loggerDelegate GULNetwork_logWithLevel:kGULNetworkLogLevelError
                                   messageCode:kGULNetworkMessageCodeURLSession000
                                       message:@"Failed to write request data to file"
                                       context:writeError];
    }
  }

  if (didWriteFile) {
    // Exclude this file from backing up to iTunes. There are conflicting reports that excluding
    // directory from backing up does not exclude files of that directory from backing up.
    [self excludeFromBackupForURL:_uploadingFileURL];

    _sessionConfig = [self backgroundSessionConfigWithSessionID:_sessionID];
    [self populateSessionConfig:_sessionConfig withRequest:request];
    session = [NSURLSession sessionWithConfiguration:_sessionConfig
                                            delegate:self
                                       delegateQueue:[NSOperationQueue mainQueue]];
    postRequestTask = [session uploadTaskWithRequest:request fromFile:_uploadingFileURL];
  } else {
    // If we cannot write to file, just send it in the foreground.
    _sessionConfig = [NSURLSessionConfiguration defaultSessionConfiguration];
    [self populateSessionConfig:_sessionConfig withRequest:request];
    session = [NSURLSession sessionWithConfiguration:_sessionConfig
                                            delegate:self
                                       delegateQueue:[NSOperationQueue mainQueue]];
    postRequestTask = [session uploadTaskWithRequest:request fromData:request.HTTPBody];
  }

  if (!session || !postRequestTask) {
    NSError *error = [[NSError alloc]
        initWithDomain:kGULNetworkErrorDomain
                  code:GULErrorCodeNetworkRequestCreation
              userInfo:@{kGULNetworkErrorContext : @"Cannot create network session"}];
    [self callCompletionHandler:handler withResponse:nil data:nil error:error];
    return nil;
  }

  _URLSession = session;

  // Save the session into memory.
  [[self class] setSessionInFetcherMap:self forSessionID:_sessionID];

  _request = [request copy];

  // Store completion handler because background session does not accept handler block but custom
  // delegate.
  _completionHandler = [handler copy];
  [postRequestTask resume];

  return _sessionID;
}

/// Sends an async GET request using NSURLSession for iOS >= 7.0, and returns an ID of the session.
- (nullable NSString *)sessionIDFromAsyncGETRequest:(NSURLRequest *)request
                                  completionHandler:(GULNetworkURLSessionCompletionHandler)handler
    API_AVAILABLE(ios(7.0)) {
  if (_backgroundNetworkEnabled) {
    _sessionConfig = [self backgroundSessionConfigWithSessionID:_sessionID];
  } else {
    _sessionConfig = [NSURLSessionConfiguration defaultSessionConfiguration];
  }

  [self populateSessionConfig:_sessionConfig withRequest:request];

  // Do not cache the GET request.
  _sessionConfig.URLCache = nil;

  NSURLSession *session = [NSURLSession sessionWithConfiguration:_sessionConfig
                                                        delegate:self
                                                   delegateQueue:[NSOperationQueue mainQueue]];
  NSURLSessionDownloadTask *downloadTask = [session downloadTaskWithRequest:request];

  if (!session || !downloadTask) {
    NSError *error = [[NSError alloc]
        initWithDomain:kGULNetworkErrorDomain
                  code:GULErrorCodeNetworkRequestCreation
              userInfo:@{kGULNetworkErrorContext : @"Cannot create network session"}];
    [self callCompletionHandler:handler withResponse:nil data:nil error:error];
    return nil;
  }

  _URLSession = session;

  // Save the session into memory.
  [[self class] setSessionInFetcherMap:self forSessionID:_sessionID];

  _request = [request copy];

  _completionHandler = [handler copy];
  [downloadTask resume];

  return _sessionID;
}

#pragma mark - NSURLSessionDataDelegate

/// Called by the NSURLSession when the data task has received some of the expected data.
/// Once the session is completed, URLSession:task:didCompleteWithError will be called and the
/// completion handler will be called with the downloaded data.
- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
    didReceiveData:(NSData *)data {
  @synchronized(self) {
    NSMutableData *mutableData = [[NSMutableData alloc] init];
    if (_downloadedData) {
      mutableData = _downloadedData.mutableCopy;
    }
    [mutableData appendData:data];
    _downloadedData = mutableData;
  }
}

#pragma mark - NSURLSessionTaskDelegate

/// Called by the NSURLSession once the download task is completed. The file is saved in the
/// provided URL so we need to read the data and store into _downloadedData. Once the session is
/// completed, URLSession:task:didCompleteWithError will be called and the completion handler will
/// be called with the downloaded data.
- (void)URLSession:(NSURLSession *)session
                 downloadTask:(NSURLSessionDownloadTask *)task
    didFinishDownloadingToURL:(NSURL *)url API_AVAILABLE(ios(7.0)) {
  if (!url.path) {
    [_loggerDelegate
        GULNetwork_logWithLevel:kGULNetworkLogLevelError
                    messageCode:kGULNetworkMessageCodeURLSession001
                        message:@"Unable to read downloaded data from empty temp path"];
    _downloadedData = nil;
    return;
  }

  NSError *error;
  _downloadedData = [NSData dataWithContentsOfFile:url.path options:0 error:&error];

  if (error) {
    [_loggerDelegate GULNetwork_logWithLevel:kGULNetworkLogLevelError
                                 messageCode:kGULNetworkMessageCodeURLSession002
                                     message:@"Cannot read the content of downloaded data"
                                     context:error];
    _downloadedData = nil;
  }
}

#if TARGET_OS_IOS || TARGET_OS_TV
- (void)URLSessionDidFinishEventsForBackgroundURLSession:(NSURLSession *)session
    API_AVAILABLE(ios(7.0)) {
  [_loggerDelegate GULNetwork_logWithLevel:kGULNetworkLogLevelDebug
                               messageCode:kGULNetworkMessageCodeURLSession003
                                   message:@"Background session finished"
                                   context:session.configuration.identifier];
  [self callSystemCompletionHandler:session.configuration.identifier];
}
#endif

- (void)URLSession:(NSURLSession *)session
                    task:(NSURLSessionTask *)task
    didCompleteWithError:(NSError *)error API_AVAILABLE(ios(7.0)) {
  // Avoid any chance of recursive behavior leading to it being used repeatedly.
  GULNetworkURLSessionCompletionHandler handler = _completionHandler;
  _completionHandler = nil;

  if (task.response) {
    // The following assertion should always be true for HTTP requests, see https://goo.gl/gVLxT7.
    NSAssert([task.response isKindOfClass:[NSHTTPURLResponse class]], @"URL response must be HTTP");

    // The server responded so ignore the error created by the system.
    error = nil;
  } else if (!error) {
    error = [[NSError alloc]
        initWithDomain:kGULNetworkErrorDomain
                  code:GULErrorCodeNetworkInvalidResponse
              userInfo:@{kGULNetworkErrorContext : @"Network Error: Empty network response"}];
  }

  [self callCompletionHandler:handler
                 withResponse:(NSHTTPURLResponse *)task.response
                         data:_downloadedData
                        error:error];

  // Remove the temp file to avoid trashing devices with lots of temp files.
  [self removeTempItemAtURL:_uploadingFileURL];

  // Try to clean up stale files again.
  [self maybeRemoveTempFilesAtURL:_networkDirectoryURL
                     expiringTime:kGULNetworkTempFolderExpireTime];

  // This is called without checking the sessionID here since non-background sessions
  // won't have an ID.
  [session finishTasksAndInvalidate];

  // Explicitly remove the session so it won't be reused. The weak map table should
  // remove the session on deallocation, but dealloc may not happen immediately after
  // calling `finishTasksAndInvalidate`.
  NSString *sessionID = session.configuration.identifier;
  [[self class] setSessionInFetcherMap:nil forSessionID:sessionID];
}

- (void)URLSession:(NSURLSession *)session
                   task:(NSURLSessionTask *)task
    didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
      completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition,
                                  NSURLCredential *credential))completionHandler
    API_AVAILABLE(ios(7.0)) {
  // The handling is modeled after GTMSessionFetcher.
  if ([challenge.protectionSpace.authenticationMethod
          isEqualToString:NSURLAuthenticationMethodServerTrust]) {
    SecTrustRef serverTrust = challenge.protectionSpace.serverTrust;
    if (serverTrust == NULL) {
      [_loggerDelegate GULNetwork_logWithLevel:kGULNetworkLogLevelDebug
                                   messageCode:kGULNetworkMessageCodeURLSession004
                                       message:@"Received empty server trust for host. Host"
                                       context:_request.URL];
      completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
      return;
    }
    NSURLCredential *credential = [NSURLCredential credentialForTrust:serverTrust];
    if (!credential) {
      [_loggerDelegate GULNetwork_logWithLevel:kGULNetworkLogLevelWarning
                                   messageCode:kGULNetworkMessageCodeURLSession005
                                       message:@"Unable to verify server identity. Host"
                                       context:_request.URL];
      completionHandler(NSURLSessionAuthChallengeCancelAuthenticationChallenge, nil);
      return;
    }

    [_loggerDelegate GULNetwork_logWithLevel:kGULNetworkLogLevelDebug
                                 messageCode:kGULNetworkMessageCodeURLSession006
                                     message:@"Received SSL challenge for host. Host"
                                     context:_request.URL];

    void (^callback)(BOOL) = ^(BOOL allow) {
      if (allow) {
        completionHandler(NSURLSessionAuthChallengeUseCredential, credential);
      } else {
        [self->_loggerDelegate
            GULNetwork_logWithLevel:kGULNetworkLogLevelDebug
                        messageCode:kGULNetworkMessageCodeURLSession007
                            message:@"Cancelling authentication challenge for host. Host"
                            context:self->_request.URL];
        completionHandler(NSURLSessionAuthChallengeCancelAuthenticationChallenge, nil);
      }
    };

    // Retain the trust object to avoid a SecTrustEvaluate() crash on iOS 7.
    CFRetain(serverTrust);

    // Evaluate the certificate chain.
    //
    // The delegate queue may be the main thread. Trust evaluation could cause some
    // blocking network activity, so we must evaluate async, as documented at
    // https://developer.apple.com/library/ios/technotes/tn2232/
    dispatch_queue_t evaluateBackgroundQueue =
        dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);

    dispatch_async(evaluateBackgroundQueue, ^{
      SecTrustResultType trustEval = kSecTrustResultInvalid;
      BOOL shouldAllow;
      OSStatus trustError;

      @synchronized([GULNetworkURLSession class]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        trustError = SecTrustEvaluate(serverTrust, &trustEval);
#pragma clang dianostic pop
      }

      if (trustError != errSecSuccess) {
        [self->_loggerDelegate GULNetwork_logWithLevel:kGULNetworkLogLevelError
                                           messageCode:kGULNetworkMessageCodeURLSession008
                                               message:@"Cannot evaluate server trust. Error, host"
                                              contexts:@[ @(trustError), self->_request.URL ]];
        shouldAllow = NO;
      } else {
        // Having a trust level "unspecified" by the user is the usual result, described at
        // https://developer.apple.com/library/mac/qa/qa1360
        shouldAllow =
            (trustEval == kSecTrustResultUnspecified || trustEval == kSecTrustResultProceed);
      }

      // Call the call back with the permission.
      callback(shouldAllow);

      CFRelease(serverTrust);
    });
    return;
  }

  // Default handling for other Auth Challenges.
  completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
}

#pragma mark - Internal Methods

/// Stores system completion handler with session ID as key.
- (void)addSystemCompletionHandler:(GULNetworkSystemCompletionHandler)handler
                        forSession:(NSString *)identifier {
  if (!handler) {
    [_loggerDelegate
        GULNetwork_logWithLevel:kGULNetworkLogLevelError
                    messageCode:kGULNetworkMessageCodeURLSession009
                        message:@"Cannot store nil system completion handler in network"];
    return;
  }

  if (!identifier.length) {
    [_loggerDelegate
        GULNetwork_logWithLevel:kGULNetworkLogLevelError
                    messageCode:kGULNetworkMessageCodeURLSession010
                        message:@"Cannot store system completion handler with empty network "
                                 "session identifier"];
    return;
  }

  GULMutableDictionary *systemCompletionHandlers =
      [[self class] sessionIDToSystemCompletionHandlerDictionary];
  if (systemCompletionHandlers[identifier]) {
    [_loggerDelegate GULNetwork_logWithLevel:kGULNetworkLogLevelWarning
                                 messageCode:kGULNetworkMessageCodeURLSession011
                                     message:@"Got multiple system handlers for a single session ID"
                                     context:identifier];
  }

  systemCompletionHandlers[identifier] = handler;
}

/// Calls the system provided completion handler with the session ID stored in the dictionary.
/// The handler will be removed from the dictionary after being called.
- (void)callSystemCompletionHandler:(NSString *)identifier {
  GULMutableDictionary *systemCompletionHandlers =
      [[self class] sessionIDToSystemCompletionHandlerDictionary];
  GULNetworkSystemCompletionHandler handler = [systemCompletionHandlers objectForKey:identifier];

  if (handler) {
    [systemCompletionHandlers removeObjectForKey:identifier];

    dispatch_async(dispatch_get_main_queue(), ^{
      handler();
    });
  }
}

/// Sets or updates the session ID of this session.
- (void)setSessionID:(NSString *)sessionID {
  _sessionID = [sessionID copy];
}

/// Creates a background session configuration with the session ID using the supported method.
- (NSURLSessionConfiguration *)backgroundSessionConfigWithSessionID:(NSString *)sessionID
    API_AVAILABLE(ios(7.0)) {
#if (TARGET_OS_OSX && defined(MAC_OS_X_VERSION_10_10) &&         \
     MAC_OS_X_VERSION_MIN_REQUIRED >= MAC_OS_X_VERSION_10_10) || \
    TARGET_OS_TV ||                                              \
    (TARGET_OS_IOS && defined(__IPHONE_8_0) && __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_8_0)

  // iOS 8/10.10 builds require the new backgroundSessionConfiguration method name.
  return [NSURLSessionConfiguration backgroundSessionConfigurationWithIdentifier:sessionID];

#elif (TARGET_OS_OSX && defined(MAC_OS_X_VERSION_10_10) &&        \
       MAC_OS_X_VERSION_MIN_REQUIRED < MAC_OS_X_VERSION_10_10) || \
    (TARGET_OS_IOS && defined(__IPHONE_8_0) && __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0)

  // Do a runtime check to avoid a deprecation warning about using
  // +backgroundSessionConfiguration: on iOS 8.
  if ([NSURLSessionConfiguration
          respondsToSelector:@selector(backgroundSessionConfigurationWithIdentifier:)]) {
    // Running on iOS 8+/OS X 10.10+.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability"
    return [NSURLSessionConfiguration backgroundSessionConfigurationWithIdentifier:sessionID];
#pragma clang diagnostic pop
  } else {
    // Running on iOS 7/OS X 10.9.
    return [NSURLSessionConfiguration backgroundSessionConfiguration:sessionID];
  }

#else
  // Building with an SDK earlier than iOS 8/OS X 10.10.
  return [NSURLSessionConfiguration backgroundSessionConfiguration:sessionID];
#endif
}

- (void)maybeRemoveTempFilesAtURL:(NSURL *)folderURL expiringTime:(NSTimeInterval)staleTime {
  if (!folderURL.absoluteString.length) {
    return;
  }

  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSError *error = nil;

  NSArray *properties = @[ NSURLCreationDateKey ];
  NSArray *directoryContent =
      [fileManager contentsOfDirectoryAtURL:folderURL
                 includingPropertiesForKeys:properties
                                    options:NSDirectoryEnumerationSkipsSubdirectoryDescendants
                                      error:&error];
  if (error && error.code != NSFileReadNoSuchFileError) {
    [_loggerDelegate
        GULNetwork_logWithLevel:kGULNetworkLogLevelDebug
                    messageCode:kGULNetworkMessageCodeURLSession012
                        message:@"Cannot get files from the temporary network folder. Error"
                        context:error];
    return;
  }

  if (!directoryContent.count) {
    return;
  }

  NSTimeInterval now = [NSDate date].timeIntervalSince1970;
  for (NSURL *tempFile in directoryContent) {
    NSDate *creationDate;
    BOOL getCreationDate = [tempFile getResourceValue:&creationDate
                                               forKey:NSURLCreationDateKey
                                                error:NULL];
    if (!getCreationDate) {
      continue;
    }
    NSTimeInterval creationTimeInterval = creationDate.timeIntervalSince1970;
    if (fabs(now - creationTimeInterval) > staleTime) {
      [self removeTempItemAtURL:tempFile];
    }
  }
}

/// Removes the temporary file written to disk for sending the request. It has to be cleaned up
/// after the session is done.
- (void)removeTempItemAtURL:(NSURL *)fileURL {
  if (!fileURL.absoluteString.length) {
    return;
  }

  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSError *error = nil;

  if (![fileManager removeItemAtURL:fileURL error:&error] && error.code != NSFileNoSuchFileError) {
    [_loggerDelegate
        GULNetwork_logWithLevel:kGULNetworkLogLevelError
                    messageCode:kGULNetworkMessageCodeURLSession013
                        message:@"Failed to remove temporary uploading data file. Error"
                        context:error.localizedDescription];
  }
}

/// Gets the fetcher with the session ID.
+ (instancetype)fetcherWithSessionIdentifier:(NSString *)sessionIdentifier {
  GULNetworkURLSession *session = [self sessionFromFetcherMapForSessionID:sessionIdentifier];
  if (!session && [sessionIdentifier hasPrefix:kGULNetworkBackgroundSessionConfigIDPrefix]) {
    session = [[GULNetworkURLSession alloc] initWithNetworkLoggerDelegate:nil];
    [session setSessionID:sessionIdentifier];
    [self setSessionInFetcherMap:session forSessionID:sessionIdentifier];
  }
  return session;
}

/// Returns a map of the fetcher by session ID. Creates a map if it is not created.
/// When reading and writing from/to the session map, don't use this method directly.
/// To avoid thread safety issues, use one of the helper methods at the bottom of the
/// file: setSessionInFetcherMap:forSessionID:, sessionFromFetcherMapForSessionID:
+ (NSMapTable<NSString *, GULNetworkURLSession *> *)sessionIDToFetcherMap {
  static NSMapTable *sessionIDToFetcherMap;

  static dispatch_once_t sessionMapOnceToken;
  dispatch_once(&sessionMapOnceToken, ^{
    sessionIDToFetcherMap = [NSMapTable strongToWeakObjectsMapTable];
  });
  return sessionIDToFetcherMap;
}

+ (NSLock *)sessionIDToFetcherMapReadWriteLock {
  static NSLock *lock;

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    lock = [[NSLock alloc] init];
  });
  return lock;
}

/// Returns a map of system provided completion handler by session ID. Creates a map if it is not
/// created.
+ (GULMutableDictionary *)sessionIDToSystemCompletionHandlerDictionary {
  static GULMutableDictionary *systemCompletionHandlers;

  static dispatch_once_t systemCompletionHandlerOnceToken;
  dispatch_once(&systemCompletionHandlerOnceToken, ^{
    systemCompletionHandlers = [[GULMutableDictionary alloc] init];
  });
  return systemCompletionHandlers;
}

- (NSURL *)temporaryFilePathWithSessionID:(NSString *)sessionID {
  NSString *tempName = [NSString stringWithFormat:@"GULUpload_temp_%@", sessionID];
  return [_networkDirectoryURL URLByAppendingPathComponent:tempName];
}

/// Makes sure that the directory to store temp files exists. If not, tries to create it and returns
/// YES. If there is anything wrong, returns NO.
- (BOOL)ensureTemporaryDirectoryExists {
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSError *error = nil;

  // Create a temporary directory if it does not exist or was deleted.
  if ([_networkDirectoryURL checkResourceIsReachableAndReturnError:&error]) {
    return YES;
  }

  if (error && error.code != NSFileReadNoSuchFileError) {
    [_loggerDelegate
        GULNetwork_logWithLevel:kGULNetworkLogLevelWarning
                    messageCode:kGULNetworkMessageCodeURLSession014
                        message:@"Error while trying to access Network temp folder. Error"
                        context:error];
  }

  NSError *writeError = nil;

  [fileManager createDirectoryAtURL:_networkDirectoryURL
        withIntermediateDirectories:YES
                         attributes:nil
                              error:&writeError];
  if (writeError) {
    [_loggerDelegate GULNetwork_logWithLevel:kGULNetworkLogLevelError
                                 messageCode:kGULNetworkMessageCodeURLSession015
                                     message:@"Cannot create temporary directory. Error"
                                     context:writeError];
    return NO;
  }

  // Set the iCloud exclusion attribute on the Documents URL.
  [self excludeFromBackupForURL:_networkDirectoryURL];

  return YES;
}

- (void)excludeFromBackupForURL:(NSURL *)url {
  if (!url.path) {
    return;
  }

  // Set the iCloud exclusion attribute on the Documents URL.
  NSError *preventBackupError = nil;
  [url setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:&preventBackupError];
  if (preventBackupError) {
    [_loggerDelegate GULNetwork_logWithLevel:kGULNetworkLogLevelError
                                 messageCode:kGULNetworkMessageCodeURLSession016
                                     message:@"Cannot exclude temporary folder from iTunes backup"];
  }
}

- (void)URLSession:(NSURLSession *)session
                          task:(NSURLSessionTask *)task
    willPerformHTTPRedirection:(NSHTTPURLResponse *)response
                    newRequest:(NSURLRequest *)request
             completionHandler:(void (^)(NSURLRequest *))completionHandler API_AVAILABLE(ios(7.0)) {
  NSArray *nonAllowedRedirectionCodes = @[
    @(kGULNetworkHTTPStatusCodeFound), @(kGULNetworkHTTPStatusCodeMovedPermanently),
    @(kGULNetworkHTTPStatusCodeMovedTemporarily), @(kGULNetworkHTTPStatusCodeMultipleChoices)
  ];

  // Allow those not in the non allowed list to be followed.
  if (![nonAllowedRedirectionCodes containsObject:@(response.statusCode)]) {
    completionHandler(request);
    return;
  }

  // Do not allow redirection if the response code is in the non-allowed list.
  NSURLRequest *newRequest = request;

  if (response) {
    newRequest = nil;
  }

  completionHandler(newRequest);
}

#pragma mark - Helper Methods

+ (void)setSessionInFetcherMap:(GULNetworkURLSession *)session forSessionID:(NSString *)sessionID {
  [[self sessionIDToFetcherMapReadWriteLock] lock];
  GULNetworkURLSession *existingSession =
      [[[self class] sessionIDToFetcherMap] objectForKey:sessionID];
  if (existingSession) {
    if (session) {
      NSString *message = [NSString stringWithFormat:@"Discarding session: %@", existingSession];
      [existingSession->_loggerDelegate GULNetwork_logWithLevel:kGULNetworkLogLevelInfo
                                                    messageCode:kGULNetworkMessageCodeURLSession019
                                                        message:message];
    }
    [existingSession->_URLSession finishTasksAndInvalidate];
  }
  if (session) {
    [[[self class] sessionIDToFetcherMap] setObject:session forKey:sessionID];
  } else {
    [[[self class] sessionIDToFetcherMap] removeObjectForKey:sessionID];
  }
  [[self sessionIDToFetcherMapReadWriteLock] unlock];
}

+ (nullable GULNetworkURLSession *)sessionFromFetcherMapForSessionID:(NSString *)sessionID {
  [[self sessionIDToFetcherMapReadWriteLock] lock];
  GULNetworkURLSession *session = [[[self class] sessionIDToFetcherMap] objectForKey:sessionID];
  [[self sessionIDToFetcherMapReadWriteLock] unlock];
  return session;
}

- (void)callCompletionHandler:(GULNetworkURLSessionCompletionHandler)handler
                 withResponse:(NSHTTPURLResponse *)response
                         data:(NSData *)data
                        error:(NSError *)error {
  if (error) {
    [_loggerDelegate GULNetwork_logWithLevel:kGULNetworkLogLevelError
                                 messageCode:kGULNetworkMessageCodeURLSession017
                                     message:@"Encounter network error. Code, error"
                                    contexts:@[ @(error.code), error ]];
  }

  if (handler) {
    dispatch_async(dispatch_get_main_queue(), ^{
      handler(response, data, self->_sessionID, error);
    });
  }
}

// Always use the request parameters even if the default session configuration is more restrictive.
- (void)populateSessionConfig:(NSURLSessionConfiguration *)sessionConfig
                  withRequest:(NSURLRequest *)request API_AVAILABLE(ios(7.0)) {
  sessionConfig.HTTPAdditionalHeaders = request.allHTTPHeaderFields;
  sessionConfig.timeoutIntervalForRequest = request.timeoutInterval;
  sessionConfig.timeoutIntervalForResource = request.timeoutInterval;
  sessionConfig.requestCachePolicy = request.cachePolicy;
}

@end
