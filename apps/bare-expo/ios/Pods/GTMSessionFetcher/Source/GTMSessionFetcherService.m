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

#import "GTMSessionFetcherService.h"

NSString *const kGTMSessionFetcherServiceSessionBecameInvalidNotification
    = @"kGTMSessionFetcherServiceSessionBecameInvalidNotification";
NSString *const kGTMSessionFetcherServiceSessionKey
    = @"kGTMSessionFetcherServiceSessionKey";

#if !GTMSESSION_BUILD_COMBINED_SOURCES
@interface GTMSessionFetcher (ServiceMethods)
- (BOOL)beginFetchMayDelay:(BOOL)mayDelay
              mayAuthorize:(BOOL)mayAuthorize;
@end
#endif  // !GTMSESSION_BUILD_COMBINED_SOURCES

@interface GTMSessionFetcherService ()

@property(atomic, strong, readwrite) NSDictionary *delayedFetchersByHost;
@property(atomic, strong, readwrite) NSDictionary *runningFetchersByHost;

@end

// Since NSURLSession doesn't support a separate delegate per task (!), instances of this
// class serve as a session delegate trampoline.
//
// This class maps a session's tasks to fetchers, and resends delegate messages to the task's
// fetcher.
@interface GTMSessionFetcherSessionDelegateDispatcher : NSObject<NSURLSessionDelegate>

// The session for the tasks in this dispatcher's task-to-fetcher map.
@property(atomic) NSURLSession *session;

// The timer interval for invalidating a session that has no active tasks.
@property(atomic) NSTimeInterval discardInterval;

// The current discard timer.
@property(atomic, readonly) NSTimer *discardTimer;


- (instancetype)initWithParentService:(GTMSessionFetcherService *)parentService
               sessionDiscardInterval:(NSTimeInterval)discardInterval;

- (void)setFetcher:(GTMSessionFetcher *)fetcher
           forTask:(NSURLSessionTask *)task;
- (void)removeFetcher:(GTMSessionFetcher *)fetcher;

// Before using a session, tells the delegate dispatcher to stop the discard timer.
- (void)startSessionUsage;

// When abandoning a delegate dispatcher, we want to avoid the session retaining
// the delegate after tasks complete.
- (void)abandon;

@end


@implementation GTMSessionFetcherService {
  NSMutableDictionary *_delayedFetchersByHost;
  NSMutableDictionary *_runningFetchersByHost;
  NSUInteger _maxRunningFetchersPerHost;

  // When this ivar is nil, the service will not reuse sessions.
  GTMSessionFetcherSessionDelegateDispatcher *_delegateDispatcher;

  // Fetchers will wait on this if another fetcher is creating the shared NSURLSession.
  dispatch_semaphore_t _sessionCreationSemaphore;

  dispatch_queue_t _callbackQueue;
  NSOperationQueue *_delegateQueue;
  NSHTTPCookieStorage *_cookieStorage;
  NSString *_userAgent;
  NSTimeInterval _timeout;

  NSURLCredential *_credential;       // Username & password.
  NSURLCredential *_proxyCredential;  // Credential supplied to proxy servers.

  NSInteger _cookieStorageMethod;

  id<GTMFetcherAuthorizationProtocol> _authorizer;

  // For waitForCompletionOfAllFetchersWithTimeout: we need to wait on stopped fetchers since
  // they've not yet finished invoking their queued callbacks. This array is nil except when
  // waiting on fetchers.
  NSMutableArray *_stoppedFetchersToWaitFor;

  // For fetchers that enqueued their callbacks before stopAllFetchers was called on the service,
  // set a barrier so the callbacks know to bail out.
  NSDate *_stoppedAllFetchersDate;
}

@synthesize maxRunningFetchersPerHost = _maxRunningFetchersPerHost,
            configuration = _configuration,
            configurationBlock = _configurationBlock,
            cookieStorage = _cookieStorage,
            userAgent = _userAgent,
            challengeBlock = _challengeBlock,
            credential = _credential,
            proxyCredential = _proxyCredential,
            allowedInsecureSchemes = _allowedInsecureSchemes,
            allowLocalhostRequest = _allowLocalhostRequest,
            allowInvalidServerCertificates = _allowInvalidServerCertificates,
            retryEnabled = _retryEnabled,
            retryBlock = _retryBlock,
            maxRetryInterval = _maxRetryInterval,
            minRetryInterval = _minRetryInterval,
            metricsCollectionBlock = _metricsCollectionBlock,
            properties = _properties,
            unusedSessionTimeout = _unusedSessionTimeout,
            testBlock = _testBlock;

#if GTM_BACKGROUND_TASK_FETCHING
@synthesize skipBackgroundTask = _skipBackgroundTask;
#endif

- (instancetype)init {
  self = [super init];
  if (self) {
    _delayedFetchersByHost = [[NSMutableDictionary alloc] init];
    _runningFetchersByHost = [[NSMutableDictionary alloc] init];
    _maxRunningFetchersPerHost = 10;
    _cookieStorageMethod = -1;
    _unusedSessionTimeout = 60.0;
    _delegateDispatcher =
        [[GTMSessionFetcherSessionDelegateDispatcher alloc] initWithParentService:self
                                                           sessionDiscardInterval:_unusedSessionTimeout];
    _callbackQueue = dispatch_get_main_queue();

    _delegateQueue = [[NSOperationQueue alloc] init];
    _delegateQueue.maxConcurrentOperationCount = 1;
    _delegateQueue.name = @"com.google.GTMSessionFetcher.NSURLSessionDelegateQueue";

    _sessionCreationSemaphore = dispatch_semaphore_create(1);

    // Starting with the SDKs for OS X 10.11/iOS 9, the service has a default useragent.
    // Apps can remove this and get the default system "CFNetwork" useragent by setting the
    // fetcher service's userAgent property to nil.
#if (!TARGET_OS_IPHONE && defined(MAC_OS_X_VERSION_10_11) && MAC_OS_X_VERSION_MAX_ALLOWED >= MAC_OS_X_VERSION_10_11) \
    || (TARGET_OS_IPHONE && defined(__IPHONE_9_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_9_0)
    _userAgent = GTMFetcherStandardUserAgentString(nil);
#endif
  }
  return self;
}

- (void)dealloc {
  [self detachAuthorizer];
  [_delegateDispatcher abandon];
}

#pragma mark Generate a new fetcher

// Clients may override this method. Clients should not override any other library methods.
- (id)fetcherWithRequest:(NSURLRequest *)request
            fetcherClass:(Class)fetcherClass {
  GTMSessionFetcher *fetcher = [[fetcherClass alloc] initWithRequest:request
                                                       configuration:self.configuration];
  fetcher.callbackQueue = self.callbackQueue;
  fetcher.sessionDelegateQueue = self.sessionDelegateQueue;
  fetcher.challengeBlock = self.challengeBlock;
  fetcher.credential = self.credential;
  fetcher.proxyCredential = self.proxyCredential;
  fetcher.authorizer = self.authorizer;
  fetcher.cookieStorage = self.cookieStorage;
  fetcher.allowedInsecureSchemes = self.allowedInsecureSchemes;
  fetcher.allowLocalhostRequest = self.allowLocalhostRequest;
  fetcher.allowInvalidServerCertificates = self.allowInvalidServerCertificates;
  fetcher.configurationBlock = self.configurationBlock;
  fetcher.retryEnabled = self.retryEnabled;
  fetcher.retryBlock = self.retryBlock;
  fetcher.maxRetryInterval = self.maxRetryInterval;
  fetcher.minRetryInterval = self.minRetryInterval;
  if (@available(iOS 10.0, macOS 10.12, tvOS 10.0, watchOS 3.0, *)) {
    fetcher.metricsCollectionBlock = self.metricsCollectionBlock;
  }
  fetcher.properties = self.properties;
  fetcher.service = self;
  if (self.cookieStorageMethod >= 0) {
    [fetcher setCookieStorageMethod:self.cookieStorageMethod];
  }

#if GTM_BACKGROUND_TASK_FETCHING
  fetcher.skipBackgroundTask = self.skipBackgroundTask;
#endif

  NSString *userAgent = self.userAgent;
  if (userAgent.length > 0
      && [request valueForHTTPHeaderField:@"User-Agent"] == nil) {
    [fetcher setRequestValue:userAgent
          forHTTPHeaderField:@"User-Agent"];
  }
  fetcher.testBlock = self.testBlock;

  return fetcher;
}

- (GTMSessionFetcher *)fetcherWithRequest:(NSURLRequest *)request {
  return [self fetcherWithRequest:request
                     fetcherClass:[GTMSessionFetcher class]];
}

- (GTMSessionFetcher *)fetcherWithURL:(NSURL *)requestURL {
  return [self fetcherWithRequest:[NSURLRequest requestWithURL:requestURL]];
}

- (GTMSessionFetcher *)fetcherWithURLString:(NSString *)requestURLString {
  NSURL *url = [NSURL URLWithString:requestURLString];
  return [self fetcherWithURL:url];
}

// Returns a session for the fetcher's host, or nil.
- (NSURLSession *)session {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSURLSession *session = _delegateDispatcher.session;
    return session;
  }
}

// Returns a session for the fetcher's host, or nil.  For shared sessions, this
// waits on a semaphore, blocking other fetchers while the caller creates the
// session if needed.
- (NSURLSession *)sessionForFetcherCreation {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);
    if (!_delegateDispatcher) {
      // This fetcher is creating a non-shared session, so skip the semaphore usage.
      return nil;
    }
  }

  // Wait if another fetcher is currently creating a session; avoid waiting
  // inside the @synchronized block, as that can deadlock.
  dispatch_semaphore_wait(_sessionCreationSemaphore, DISPATCH_TIME_FOREVER);

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    // Before getting the NSURLSession for task creation, it is
    // important to invalidate and nil out the session discard timer; otherwise
    // the session can be invalidated between when it is returned to the
    // fetcher, and when the fetcher attempts to create its NSURLSessionTask.
    [_delegateDispatcher startSessionUsage];

    NSURLSession *session = _delegateDispatcher.session;
    if (session) {
      // The calling fetcher will receive a preexisting session, so
      // we can allow other fetchers to create a session.
      dispatch_semaphore_signal(_sessionCreationSemaphore);
    } else {
      // No existing session was obtained, so the calling fetcher will create the session;
      // it *must* invoke fetcherDidCreateSession: to signal the dispatcher's semaphore after
      // the session has been created (or fails to be created) to avoid a hang.
    }
    return session;
  }
}

- (id<NSURLSessionDelegate>)sessionDelegate {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _delegateDispatcher;
  }
}

#pragma mark Queue Management

- (void)addRunningFetcher:(GTMSessionFetcher *)fetcher
                  forHost:(NSString *)host {
  // Add to the array of running fetchers for this host, creating the array if needed.
  NSMutableArray *runningForHost = [_runningFetchersByHost objectForKey:host];
  if (runningForHost == nil) {
    runningForHost = [NSMutableArray arrayWithObject:fetcher];
    [_runningFetchersByHost setObject:runningForHost forKey:host];
  } else {
    [runningForHost addObject:fetcher];
  }
}

- (void)addDelayedFetcher:(GTMSessionFetcher *)fetcher
                  forHost:(NSString *)host {
  // Add to the array of delayed fetchers for this host, creating the array if needed.
  NSMutableArray *delayedForHost = [_delayedFetchersByHost objectForKey:host];
  if (delayedForHost == nil) {
    delayedForHost = [NSMutableArray arrayWithObject:fetcher];
    [_delayedFetchersByHost setObject:delayedForHost forKey:host];
  } else {
    [delayedForHost addObject:fetcher];
  }
}

- (BOOL)isDelayingFetcher:(GTMSessionFetcher *)fetcher {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSString *host = fetcher.request.URL.host;
    if (host == nil) {
      return NO;
    }
    NSArray *delayedForHost = [_delayedFetchersByHost objectForKey:host];
    NSUInteger idx = [delayedForHost indexOfObjectIdenticalTo:fetcher];
    BOOL isDelayed = (delayedForHost != nil) && (idx != NSNotFound);
    return isDelayed;
  }
}

- (BOOL)fetcherShouldBeginFetching:(GTMSessionFetcher *)fetcher {
  // Entry point from the fetcher
  NSURL *requestURL = fetcher.request.URL;
  NSString *host = requestURL.host;

  // Addresses "file:///path" case where localhost is the implicit host.
  if (host.length == 0 && [requestURL isFileURL]) {
    host = @"localhost";
  }

  if (host.length == 0) {
    // Data URIs legitimately have no host, reject other hostless URLs.
    GTMSESSION_ASSERT_DEBUG([[requestURL scheme] isEqual:@"data"], @"%@ lacks host", fetcher);
    return YES;
  }

  BOOL shouldBeginResult;

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSMutableArray *runningForHost = [_runningFetchersByHost objectForKey:host];
    if (runningForHost != nil
        && [runningForHost indexOfObjectIdenticalTo:fetcher] != NSNotFound) {
      GTMSESSION_ASSERT_DEBUG(NO, @"%@ was already running", fetcher);
      return YES;
    }

    BOOL shouldRunNow = (fetcher.usingBackgroundSession
                         || _maxRunningFetchersPerHost == 0
                         || _maxRunningFetchersPerHost >
                         [[self class] numberOfNonBackgroundSessionFetchers:runningForHost]);
    if (shouldRunNow) {
      [self addRunningFetcher:fetcher forHost:host];
      shouldBeginResult = YES;
    } else {
      [self addDelayedFetcher:fetcher forHost:host];
      shouldBeginResult = NO;
    }
  }  // @synchronized(self)

  // We'll save the host that serves as the key for this fetcher's array
  // to avoid any chance of the underlying request changing, stranding
  // the fetcher in the wrong array
  fetcher.serviceHost = host;

  return shouldBeginResult;
}

- (void)startFetcher:(GTMSessionFetcher *)fetcher {
  [fetcher beginFetchMayDelay:NO
                 mayAuthorize:YES];
}

// Internal utility. Returns a fetcher's delegate if it's a dispatcher, or nil if the fetcher
// is its own delegate (possibly via proxy) and has no dispatcher.
- (GTMSessionFetcherSessionDelegateDispatcher *)delegateDispatcherForFetcher:(GTMSessionFetcher *)fetcher {
  GTMSessionCheckNotSynchronized(self);

  NSURLSession *fetcherSession = fetcher.session;
  if (fetcherSession) {
    id<NSURLSessionDelegate> fetcherDelegate = fetcherSession.delegate;
    // If the delegate is non-nil and claims to be a GTMSessionFetcher, there is no dispatcher;
    // assume the fetcher is the delegate or has been proxied (some third-party frameworks
    // are known to swizzle NSURLSession to proxy its delegate).
    BOOL hasDispatcher = (fetcherDelegate != nil &&
                          ![fetcherDelegate isKindOfClass:[GTMSessionFetcher class]]);
    if (hasDispatcher) {
      GTMSESSION_ASSERT_DEBUG([fetcherDelegate isKindOfClass:[GTMSessionFetcherSessionDelegateDispatcher class]],
                              @"Fetcher delegate class: %@", [fetcherDelegate class]);
      return (GTMSessionFetcherSessionDelegateDispatcher *)fetcherDelegate;
    }
  }
  return nil;
}

- (void)fetcherDidCreateSession:(GTMSessionFetcher *)fetcher {
  if (fetcher.canShareSession) {
    NSURLSession *fetcherSession = fetcher.session;
    GTMSESSION_ASSERT_DEBUG(fetcherSession != nil, @"Fetcher missing its session: %@", fetcher);

    GTMSessionFetcherSessionDelegateDispatcher *delegateDispatcher =
        [self delegateDispatcherForFetcher:fetcher];
    if (delegateDispatcher) {
      GTMSESSION_ASSERT_DEBUG(delegateDispatcher.session == nil,
                              @"Fetcher made an extra session: %@", fetcher);

      // Save this fetcher's session.
      delegateDispatcher.session = fetcherSession;

      // Allow other fetchers to request this session now.
      dispatch_semaphore_signal(_sessionCreationSemaphore);
    }
  }
}

- (void)fetcherDidBeginFetching:(GTMSessionFetcher *)fetcher {
  // If this fetcher has a separate delegate with a shared session, then
  // this fetcher should be added to the delegate's map of tasks to fetchers.
  GTMSessionFetcherSessionDelegateDispatcher *delegateDispatcher =
      [self delegateDispatcherForFetcher:fetcher];
  if (delegateDispatcher) {
    GTMSESSION_ASSERT_DEBUG(fetcher.canShareSession,
                            @"Inappropriate shared session: %@", fetcher);

    // There should already be a session, from this or a previous fetcher.
    //
    // Sanity check that the fetcher's session is the delegate's shared session.
    NSURLSession *sharedSession = delegateDispatcher.session;
    NSURLSession *fetcherSession = fetcher.session;
    GTMSESSION_ASSERT_DEBUG(sharedSession != nil, @"Missing delegate session: %@", fetcher);
    GTMSESSION_ASSERT_DEBUG(fetcherSession == sharedSession,
                            @"Inconsistent session: %@ %@ (shared: %@)",
                            fetcher, fetcherSession, sharedSession);

    if (sharedSession != nil && fetcherSession == sharedSession) {
      NSURLSessionTask *task = fetcher.sessionTask;
      GTMSESSION_ASSERT_DEBUG(task != nil, @"Missing session task: %@", fetcher);

      if (task) {
        [delegateDispatcher setFetcher:fetcher
                               forTask:task];
      }
    }
  }
}

- (void)stopFetcher:(GTMSessionFetcher *)fetcher {
  [fetcher stopFetching];
}

- (void)fetcherDidStop:(GTMSessionFetcher *)fetcher {
  // Entry point from the fetcher
  NSString *host = fetcher.serviceHost;
  if (!host) {
    // fetcher has been stopped previously
    return;
  }

  // This removeFetcher: invocation is a fallback; typically, fetchers are removed from the task
  // map when the task completes.
  GTMSessionFetcherSessionDelegateDispatcher *delegateDispatcher =
      [self delegateDispatcherForFetcher:fetcher];
  [delegateDispatcher removeFetcher:fetcher];

  NSMutableArray *fetchersToStart;

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    // If a test is waiting for all fetchers to stop, it needs to wait for this one
    // to invoke its callbacks on the callback queue.
    [_stoppedFetchersToWaitFor addObject:fetcher];

    NSMutableArray *runningForHost = [_runningFetchersByHost objectForKey:host];
    [runningForHost removeObject:fetcher];

    NSMutableArray *delayedForHost = [_delayedFetchersByHost objectForKey:host];
    [delayedForHost removeObject:fetcher];

    while (delayedForHost.count > 0
           && [[self class] numberOfNonBackgroundSessionFetchers:runningForHost]
              < _maxRunningFetchersPerHost) {
      // Start another delayed fetcher running, scanning for the minimum
      // priority value, defaulting to FIFO for equal priorities
      GTMSessionFetcher *nextFetcher = nil;
      for (GTMSessionFetcher *delayedFetcher in delayedForHost) {
        if (nextFetcher == nil
            || delayedFetcher.servicePriority < nextFetcher.servicePriority) {
          nextFetcher = delayedFetcher;
        }
      }

      if (nextFetcher) {
        [self addRunningFetcher:nextFetcher forHost:host];
        runningForHost = [_runningFetchersByHost objectForKey:host];

        [delayedForHost removeObjectIdenticalTo:nextFetcher];

        if (!fetchersToStart) {
          fetchersToStart = [NSMutableArray array];
        }
        [fetchersToStart addObject:nextFetcher];
      }
    }

    if (runningForHost.count == 0) {
      // None left; remove the empty array
      [_runningFetchersByHost removeObjectForKey:host];
    }

    if (delayedForHost.count == 0) {
      [_delayedFetchersByHost removeObjectForKey:host];
    }
  }  // @synchronized(self)

  // Start fetchers outside of the synchronized block to avoid a deadlock.
  for (GTMSessionFetcher *nextFetcher in fetchersToStart) {
    [self startFetcher:nextFetcher];
  }

  // The fetcher is no longer in the running or the delayed array,
  // so remove its host and thread properties
  fetcher.serviceHost = nil;
}

- (NSUInteger)numberOfFetchers {
  NSUInteger running = [self numberOfRunningFetchers];
  NSUInteger delayed = [self numberOfDelayedFetchers];
  return running + delayed;
}

- (NSUInteger)numberOfRunningFetchers {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSUInteger sum = 0;
    for (NSString *host in _runningFetchersByHost) {
      NSArray *fetchers = [_runningFetchersByHost objectForKey:host];
      sum += fetchers.count;
    }
    return sum;
  }
}

- (NSUInteger)numberOfDelayedFetchers {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSUInteger sum = 0;
    for (NSString *host in _delayedFetchersByHost) {
      NSArray *fetchers = [_delayedFetchersByHost objectForKey:host];
      sum += fetchers.count;
    }
    return sum;
  }
}

- (NSArray *)issuedFetchers {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSMutableArray *allFetchers = [NSMutableArray array];
    void (^accumulateFetchers)(id, id, BOOL *) = ^(NSString *host,
                                                   NSArray *fetchersForHost,
                                                   BOOL *stop) {
        [allFetchers addObjectsFromArray:fetchersForHost];
    };
    [_runningFetchersByHost enumerateKeysAndObjectsUsingBlock:accumulateFetchers];
    [_delayedFetchersByHost enumerateKeysAndObjectsUsingBlock:accumulateFetchers];

    GTMSESSION_ASSERT_DEBUG(allFetchers.count == [NSSet setWithArray:allFetchers].count,
                            @"Fetcher appears multiple times\n running: %@\n delayed: %@",
                            _runningFetchersByHost, _delayedFetchersByHost);

    return allFetchers.count > 0 ? allFetchers : nil;
  }
}

- (NSArray *)issuedFetchersWithRequestURL:(NSURL *)requestURL {
  NSString *host = requestURL.host;
  if (host.length == 0) return nil;

  NSURL *targetURL = [requestURL absoluteURL];

  NSArray *allFetchers = [self issuedFetchers];
  NSIndexSet *indexes = [allFetchers indexesOfObjectsPassingTest:^BOOL(GTMSessionFetcher *fetcher,
                                                                       NSUInteger idx,
                                                                       BOOL *stop) {
      NSURL *fetcherURL = [fetcher.request.URL absoluteURL];
      return [fetcherURL isEqual:targetURL];
  }];

  NSArray *result = nil;
  if (indexes.count > 0) {
    result = [allFetchers objectsAtIndexes:indexes];
  }
  return result;
}

- (void)stopAllFetchers {
  NSArray *delayedFetchersByHost;
  NSArray *runningFetchersByHost;

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    // Set the time barrier so fetchers know not to call back even if
    // the stop calls below occur after the fetchers naturally
    // stopped and so were removed from _runningFetchersByHost,
    // but while the callbacks were already enqueued before stopAllFetchers
    // was invoked.
    _stoppedAllFetchersDate = [[NSDate alloc] init];

    // Remove fetchers from the delayed list to avoid fetcherDidStop: from
    // starting more fetchers running as a side effect of stopping one
    delayedFetchersByHost = _delayedFetchersByHost.allValues;
    [_delayedFetchersByHost removeAllObjects];

    runningFetchersByHost = _runningFetchersByHost.allValues;
    [_runningFetchersByHost removeAllObjects];
  }

  for (NSArray *delayedForHost in delayedFetchersByHost) {
    for (GTMSessionFetcher *fetcher in delayedForHost) {
      [self stopFetcher:fetcher];
    }
  }

  for (NSArray *runningForHost in runningFetchersByHost) {
    for (GTMSessionFetcher *fetcher in runningForHost) {
      [self stopFetcher:fetcher];
    }
  }
}

- (NSDate *)stoppedAllFetchersDate {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _stoppedAllFetchersDate;
  }
}

#pragma mark Accessors

- (BOOL)reuseSession {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _delegateDispatcher != nil;
  }
}

- (void)setReuseSession:(BOOL)shouldReuse {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    BOOL wasReusing = (_delegateDispatcher != nil);
    if (shouldReuse != wasReusing) {
      [self abandonDispatcher];
      if (shouldReuse) {
        _delegateDispatcher =
            [[GTMSessionFetcherSessionDelegateDispatcher alloc] initWithParentService:self
                                                               sessionDiscardInterval:_unusedSessionTimeout];
      } else {
        _delegateDispatcher = nil;
      }
    }
  }
}

- (void)resetSession {
  GTMSessionCheckNotSynchronized(self);
  dispatch_semaphore_wait(_sessionCreationSemaphore, DISPATCH_TIME_FOREVER);

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);
    [self resetSessionInternal];
  }

  dispatch_semaphore_signal(_sessionCreationSemaphore);
}

- (void)resetSessionInternal {
  GTMSessionCheckSynchronized(self);

  // The old dispatchers may be retained as delegates of any ongoing sessions by those sessions.
  if (_delegateDispatcher) {
    [self abandonDispatcher];
    _delegateDispatcher =
        [[GTMSessionFetcherSessionDelegateDispatcher alloc] initWithParentService:self
                                                           sessionDiscardInterval:_unusedSessionTimeout];
  }
}

- (void)resetSessionForDispatcherDiscardTimer:(NSTimer *)timer {
  GTMSessionCheckNotSynchronized(self);

  dispatch_semaphore_wait(_sessionCreationSemaphore, DISPATCH_TIME_FOREVER);
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_delegateDispatcher.discardTimer == timer) {
      // If the delegate dispatcher's current discardTimer is the same object as the timer
      // that fired, no fetcher has recently attempted to start using the session by calling
      // startSessionUsage, which invalidates and nils out the timer.
      [self resetSessionInternal];
    } else {
      // A fetcher has invalidated the timer between its triggering and now, potentially
      // meaning a fetcher has requested access to the NSURLSession, and may be in the process
      // of starting a new task. The dispatcher should not be abandoned, as this can lead
      // to a race condition between calling -finishTasksAndInvalidate on the NSURLSession
      // and the fetcher attempting to create a new task.
    }
  }

  dispatch_semaphore_signal(_sessionCreationSemaphore);
}

- (NSTimeInterval)unusedSessionTimeout {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _unusedSessionTimeout;
  }
}

- (void)setUnusedSessionTimeout:(NSTimeInterval)timeout {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _unusedSessionTimeout = timeout;
    _delegateDispatcher.discardInterval = timeout;
  }
}

// This method should be called inside of @synchronized(self)
- (void)abandonDispatcher {
  GTMSessionCheckSynchronized(self);
  [_delegateDispatcher abandon];
}

- (NSDictionary *)runningFetchersByHost {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return [_runningFetchersByHost copy];
  }
}

- (void)setRunningFetchersByHost:(NSDictionary *)dict {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _runningFetchersByHost = [dict mutableCopy];
  }
}

- (NSDictionary *)delayedFetchersByHost {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return [_delayedFetchersByHost copy];
  }
}

- (void)setDelayedFetchersByHost:(NSDictionary *)dict {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _delayedFetchersByHost = [dict mutableCopy];
  }
}

- (id<GTMFetcherAuthorizationProtocol>)authorizer {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _authorizer;
  }
}

- (void)setAuthorizer:(id<GTMFetcherAuthorizationProtocol>)obj {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (obj != _authorizer) {
      [self detachAuthorizer];
    }

    _authorizer = obj;
  }

  // Use the fetcher service for the authorization fetches if the auth
  // object supports fetcher services
  if ([obj respondsToSelector:@selector(setFetcherService:)]) {
#if GTM_USE_SESSION_FETCHER
    [obj setFetcherService:self];
#else
    [obj setFetcherService:(id)self];
#endif
  }
}

// This should be called inside a @synchronized(self) block except during dealloc.
- (void)detachAuthorizer {
  // This method is called by the fetcher service's dealloc and setAuthorizer:
  // methods; do not override.
  //
  // The fetcher service retains the authorizer, and the authorizer has a
  // weak pointer to the fetcher service (a non-zeroing pointer for
  // compatibility with iOS 4 and Mac OS X 10.5/10.6.)
  //
  // When this fetcher service no longer uses the authorizer, we want to remove
  // the authorizer's dependence on the fetcher service.  Authorizers can still
  // function without a fetcher service.
  if ([_authorizer respondsToSelector:@selector(fetcherService)]) {
    id authFetcherService = [_authorizer fetcherService];
    if (authFetcherService == self) {
      [_authorizer setFetcherService:nil];
    }
  }
}

- (dispatch_queue_t GTM_NONNULL_TYPE)callbackQueue {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _callbackQueue;
  }  // @synchronized(self)
}

- (void)setCallbackQueue:(dispatch_queue_t GTM_NULLABLE_TYPE)queue {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _callbackQueue = queue ?: dispatch_get_main_queue();
  }  // @synchronized(self)
}

- (NSOperationQueue * GTM_NONNULL_TYPE)sessionDelegateQueue {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _delegateQueue;
  }  // @synchronized(self)
}

- (void)setSessionDelegateQueue:(NSOperationQueue * GTM_NULLABLE_TYPE)queue {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _delegateQueue = queue ?: [NSOperationQueue mainQueue];
  }  // @synchronized(self)
}

- (NSOperationQueue *)delegateQueue {
  // Provided for compatibility with the old fetcher service.  The gtm-oauth2 code respects
  // any custom delegate queue for calling the app.
  return nil;
}

+ (NSUInteger)numberOfNonBackgroundSessionFetchers:(NSArray *)fetchers {
  NSUInteger sum = 0;
  for (GTMSessionFetcher *fetcher in fetchers) {
    if (!fetcher.usingBackgroundSession) {
      ++sum;
    }
  }
  return sum;
}

@end

@implementation GTMSessionFetcherService (TestingSupport)

+ (instancetype)mockFetcherServiceWithFakedData:(NSData *)fakedDataOrNil
                                     fakedError:(NSError *)fakedErrorOrNil {
#if !GTM_DISABLE_FETCHER_TEST_BLOCK
  NSURL *url = [NSURL URLWithString:@"http://example.invalid"];
  NSHTTPURLResponse *fakedResponse =
      [[NSHTTPURLResponse alloc] initWithURL:url
                                  statusCode:(fakedErrorOrNil ? 500 : 200)
                                 HTTPVersion:@"HTTP/1.1"
                                headerFields:nil];
  return [self mockFetcherServiceWithFakedData:fakedDataOrNil
                                 fakedResponse:fakedResponse
                                    fakedError:fakedErrorOrNil];
#else
  GTMSESSION_ASSERT_DEBUG(0, @"Test blocks disabled");
  return nil;
#endif  // GTM_DISABLE_FETCHER_TEST_BLOCK
}

+ (instancetype)mockFetcherServiceWithFakedData:(NSData *)fakedDataOrNil
                                  fakedResponse:(NSHTTPURLResponse *)fakedResponse
                                     fakedError:(NSError *)fakedErrorOrNil {
#if !GTM_DISABLE_FETCHER_TEST_BLOCK
  GTMSessionFetcherService *service = [[self alloc] init];
  service.allowedInsecureSchemes = @[ @"http" ];
  service.testBlock = ^(GTMSessionFetcher *fetcherToTest,
                        GTMSessionFetcherTestResponse testResponse) {
    testResponse(fakedResponse, fakedDataOrNil, fakedErrorOrNil);
  };
  return service;
#else
  GTMSESSION_ASSERT_DEBUG(0, @"Test blocks disabled");
  return nil;
#endif  // GTM_DISABLE_FETCHER_TEST_BLOCK
}

#pragma mark Synchronous Wait for Unit Testing

- (BOOL)waitForCompletionOfAllFetchersWithTimeout:(NSTimeInterval)timeoutInSeconds {
  NSDate *giveUpDate = [NSDate dateWithTimeIntervalSinceNow:timeoutInSeconds];
  _stoppedFetchersToWaitFor = [NSMutableArray array];

  BOOL shouldSpinRunLoop = [NSThread isMainThread];
  const NSTimeInterval kSpinInterval = 0.001;
  BOOL didTimeOut = NO;
  while (([self numberOfFetchers] > 0 || _stoppedFetchersToWaitFor.count > 0)) {
    didTimeOut = [giveUpDate timeIntervalSinceNow] < 0;
    if (didTimeOut) break;

    GTMSessionFetcher *stoppedFetcher = _stoppedFetchersToWaitFor.firstObject;
    if (stoppedFetcher) {
      [_stoppedFetchersToWaitFor removeObject:stoppedFetcher];
      [stoppedFetcher waitForCompletionWithTimeout:10.0 * kSpinInterval];
    }

    if (shouldSpinRunLoop) {
      NSDate *stopDate = [NSDate dateWithTimeIntervalSinceNow:kSpinInterval];
      [[NSRunLoop currentRunLoop] runUntilDate:stopDate];
    } else {
      [NSThread sleepForTimeInterval:kSpinInterval];
    }
  }
  _stoppedFetchersToWaitFor = nil;

  return !didTimeOut;
}

@end

@implementation GTMSessionFetcherService (BackwardsCompatibilityOnly)

- (NSInteger)cookieStorageMethod {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _cookieStorageMethod;
  }
}

- (void)setCookieStorageMethod:(NSInteger)cookieStorageMethod {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _cookieStorageMethod = cookieStorageMethod;
  }
}

@end

@implementation GTMSessionFetcherSessionDelegateDispatcher {
  __weak GTMSessionFetcherService *_parentService;
  NSURLSession *_session;

  // The task map maps NSURLSessionTasks to GTMSessionFetchers
  NSMutableDictionary *_taskToFetcherMap;
  // The discard timer will invalidate sessions after the session's last task completes.
  NSTimer *_discardTimer;
  NSTimeInterval _discardInterval;
}

@synthesize discardInterval = _discardInterval,
            session = _session;

- (instancetype)init {
  [self doesNotRecognizeSelector:_cmd];
  return nil;
}

- (instancetype)initWithParentService:(GTMSessionFetcherService *)parentService
               sessionDiscardInterval:(NSTimeInterval)discardInterval {
  self = [super init];
  if (self) {
    _discardInterval = discardInterval;
    _parentService = parentService;
  }
  return self;
}

- (NSString *)description {
  return [NSString stringWithFormat:@"%@ %p %@ %@",
          [self class], self,
          _session ?: @"<no session>",
          _taskToFetcherMap.count > 0 ? _taskToFetcherMap : @"<no tasks>"];
}

- (NSTimer *)discardTimer {
  GTMSessionCheckNotSynchronized(self);
  @synchronized(self) {
    return _discardTimer;
  }
}

// This method should be called inside of a @synchronized(self) block.
- (void)startDiscardTimer {
  GTMSessionCheckSynchronized(self);
  [_discardTimer invalidate];
  _discardTimer = nil;
  if (_discardInterval > 0) {
    _discardTimer = [NSTimer timerWithTimeInterval:_discardInterval
                                            target:self
                                          selector:@selector(discardTimerFired:)
                                          userInfo:nil
                                           repeats:NO];
    [_discardTimer setTolerance:(_discardInterval / 10)];
    [[NSRunLoop mainRunLoop] addTimer:_discardTimer forMode:NSRunLoopCommonModes];
  }
}

// This method should be called inside of a @synchronized(self) block.
- (void)destroyDiscardTimer {
  GTMSessionCheckSynchronized(self);
  [_discardTimer invalidate];
  _discardTimer = nil;
}

- (void)discardTimerFired:(NSTimer *)timer {
  GTMSessionFetcherService *service;
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    NSUInteger numberOfTasks = _taskToFetcherMap.count;
    if (numberOfTasks == 0) {
      service = _parentService;
    }
  }

  // Inform the service that the discard timer has fired, and should check whether the
  // service can abandon us. -resetSession cannot be called directly, as there is a
  // race condition that must be guarded against with the NSURLSession being returned
  // from sessionForFetcherCreation outside other locks. The service can take steps
  // to prevent resetting the session if that has occurred.
  //
  // The service must be called from outside the @synchronized block.
  [service resetSessionForDispatcherDiscardTimer:timer];
}

- (void)abandon {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    [self destroySessionAndTimer];
  }
}

- (void)startSessionUsage {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    [self destroyDiscardTimer];
  }
}

// This method should be called inside of a @synchronized(self) block.
- (void)destroySessionAndTimer {
  GTMSessionCheckSynchronized(self);
  [self destroyDiscardTimer];

  // Break any retain cycle from the session holding the delegate.
  [_session finishTasksAndInvalidate];

  // Immediately clear the session so no new task may be issued with it.
  //
  // The _taskToFetcherMap needs to stay valid until the outstanding tasks finish.
  _session = nil;
}

- (void)setFetcher:(GTMSessionFetcher *)fetcher forTask:(NSURLSessionTask *)task {
  GTMSESSION_ASSERT_DEBUG(fetcher != nil, @"missing fetcher");

  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    if (_taskToFetcherMap == nil) {
      _taskToFetcherMap = [[NSMutableDictionary alloc] init];
    }

    if (fetcher) {
      [_taskToFetcherMap setObject:fetcher forKey:task];
      [self destroyDiscardTimer];
    }
  }
}

- (void)removeFetcher:(GTMSessionFetcher *)fetcher {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    // Typically, a fetcher should be removed when its task invokes
    // URLSession:task:didCompleteWithError:.
    //
    // When fetching with a testBlock, though, the task completed delegate
    // method may not be invoked, requiring cleanup here.
    NSArray *tasks = [_taskToFetcherMap allKeysForObject:fetcher];
    GTMSESSION_ASSERT_DEBUG(tasks.count <= 1, @"fetcher task not unmapped: %@", tasks);
    [_taskToFetcherMap removeObjectsForKeys:tasks];

    if (_taskToFetcherMap.count == 0) {
      [self startDiscardTimer];
    }
  }
}

// This helper method provides synchronized access to the task map for the delegate
// methods below.
- (id)fetcherForTask:(NSURLSessionTask *)task {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return [_taskToFetcherMap objectForKey:task];
  }
}

- (void)removeTaskFromMap:(NSURLSessionTask *)task {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    [_taskToFetcherMap removeObjectForKey:task];
  }
}

- (void)setSession:(NSURLSession *)session {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _session = session;
  }
}

- (NSURLSession *)session {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _session;
  }
}

- (NSTimeInterval)discardInterval {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    return _discardInterval;
  }
}

- (void)setDiscardInterval:(NSTimeInterval)interval {
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _discardInterval = interval;
  }
}

// NSURLSessionDelegate protocol methods.

// - (void)URLSessionDidFinishEventsForBackgroundURLSession:(NSURLSession *)session;
//
// TODO(seh): How do we route this to an appropriate fetcher?


- (void)URLSession:(NSURLSession *)session didBecomeInvalidWithError:(NSError *)error {
  GTM_LOG_SESSION_DELEGATE(@"%@ %p URLSession:%@ didBecomeInvalidWithError:%@",
                           [self class], self, session, error);
  NSDictionary *localTaskToFetcherMap;
  @synchronized(self) {
    GTMSessionMonitorSynchronized(self);

    _session = nil;

    localTaskToFetcherMap = [_taskToFetcherMap copy];
  }

  // Any "suspended" tasks may not have received callbacks from NSURLSession when the session
  // completes; we'll call them now.
  [localTaskToFetcherMap enumerateKeysAndObjectsUsingBlock:^(NSURLSessionTask *task,
                                                             GTMSessionFetcher *fetcher,
                                                             BOOL *stop) {
    if (fetcher.session == session) {
        // Our delegate method URLSession:task:didCompleteWithError: will rely on
        // _taskToFetcherMap so that should still contain this fetcher.
        NSError *canceledError = [NSError errorWithDomain:NSURLErrorDomain
                                                     code:NSURLErrorCancelled
                                                 userInfo:nil];
        [self URLSession:session task:task didCompleteWithError:canceledError];
      } else {
        GTMSESSION_ASSERT_DEBUG(0, @"Unexpected session in fetcher: %@ has %@ (expected %@)",
                                fetcher, fetcher.session, session);
      }
  }];

  // Our tests rely on this notification to know the session discard timer fired.
  NSDictionary *userInfo = @{ kGTMSessionFetcherServiceSessionKey : session };
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc postNotificationName:kGTMSessionFetcherServiceSessionBecameInvalidNotification
                    object:_parentService
                  userInfo:userInfo];
}


#pragma mark - NSURLSessionTaskDelegate

// NSURLSessionTaskDelegate protocol methods.
//
// We won't test here if the fetcher responds to these since we only want this
// class to implement the same delegate methods the fetcher does (so NSURLSession's
// tests for respondsToSelector: will have the same result whether the session
// delegate is the fetcher or this dispatcher.)

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
willPerformHTTPRedirection:(NSHTTPURLResponse *)response
        newRequest:(NSURLRequest *)request
 completionHandler:(void (^)(NSURLRequest *))completionHandler {
  id<NSURLSessionTaskDelegate> fetcher = [self fetcherForTask:task];
  [fetcher URLSession:session
                 task:task
willPerformHTTPRedirection:response
           newRequest:request
    completionHandler:completionHandler];
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
 completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition, NSURLCredential *))handler {
  id<NSURLSessionTaskDelegate> fetcher = [self fetcherForTask:task];
  [fetcher URLSession:session
                 task:task
  didReceiveChallenge:challenge
    completionHandler:handler];
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
 needNewBodyStream:(void (^)(NSInputStream *bodyStream))handler {
  id<NSURLSessionTaskDelegate> fetcher = [self fetcherForTask:task];
  [fetcher URLSession:session
                 task:task
    needNewBodyStream:handler];
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
   didSendBodyData:(int64_t)bytesSent
    totalBytesSent:(int64_t)totalBytesSent
totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend {
  id<NSURLSessionTaskDelegate> fetcher = [self fetcherForTask:task];
  [fetcher URLSession:session
                 task:task
      didSendBodyData:bytesSent
       totalBytesSent:totalBytesSent
totalBytesExpectedToSend:totalBytesExpectedToSend];
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didCompleteWithError:(NSError *)error {
  id<NSURLSessionTaskDelegate> fetcher = [self fetcherForTask:task];

  // This is the usual way tasks are removed from the task map.
  [self removeTaskFromMap:task];

  [fetcher URLSession:session
                 task:task
 didCompleteWithError:error];
}

- (void)URLSession:(NSURLSession *)session
                          task:(NSURLSessionTask *)task
    didFinishCollectingMetrics:(NSURLSessionTaskMetrics *)metrics
    API_AVAILABLE(ios(10.0), macosx(10.12), tvos(10.0), watchos(3.0)) {
  id<NSURLSessionTaskDelegate> fetcher = [self fetcherForTask:task];
  [fetcher URLSession:session task:task didFinishCollectingMetrics:metrics];
}

// NSURLSessionDataDelegate protocol methods.

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
didReceiveResponse:(NSURLResponse *)response
 completionHandler:(void (^)(NSURLSessionResponseDisposition))handler {
  id<NSURLSessionDataDelegate> fetcher = [self fetcherForTask:dataTask];
  [fetcher URLSession:session
             dataTask:dataTask
   didReceiveResponse:response
    completionHandler:handler];
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
didBecomeDownloadTask:(NSURLSessionDownloadTask *)downloadTask {
  id<NSURLSessionDataDelegate> fetcher = [self fetcherForTask:dataTask];
  GTMSESSION_ASSERT_DEBUG(fetcher != nil, @"Missing fetcher for %@", dataTask);
  [self removeTaskFromMap:dataTask];
  if (fetcher) {
    GTMSESSION_ASSERT_DEBUG([fetcher isKindOfClass:[GTMSessionFetcher class]],
                            @"Expecting GTMSessionFetcher");
    [self setFetcher:(GTMSessionFetcher *)fetcher forTask:downloadTask];
  }

  [fetcher URLSession:session
             dataTask:dataTask
didBecomeDownloadTask:downloadTask];
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
    didReceiveData:(NSData *)data {
  id<NSURLSessionDataDelegate> fetcher = [self fetcherForTask:dataTask];
  [fetcher URLSession:session
             dataTask:dataTask
       didReceiveData:data];
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
 willCacheResponse:(NSCachedURLResponse *)proposedResponse
 completionHandler:(void (^)(NSCachedURLResponse *))handler {
  id<NSURLSessionDataDelegate> fetcher = [self fetcherForTask:dataTask];
  [fetcher URLSession:session
             dataTask:dataTask
    willCacheResponse:proposedResponse
    completionHandler:handler];
}

// NSURLSessionDownloadDelegate protocol methods.

- (void)URLSession:(NSURLSession *)session
      downloadTask:(NSURLSessionDownloadTask *)downloadTask
didFinishDownloadingToURL:(NSURL *)location {
  id<NSURLSessionDownloadDelegate> fetcher = [self fetcherForTask:downloadTask];
  [fetcher URLSession:session
         downloadTask:downloadTask
didFinishDownloadingToURL:location];
}

- (void)URLSession:(NSURLSession *)session
      downloadTask:(NSURLSessionDownloadTask *)downloadTask
      didWriteData:(int64_t)bytesWritten
 totalBytesWritten:(int64_t)totalWritten
totalBytesExpectedToWrite:(int64_t)totalExpected {
  id<NSURLSessionDownloadDelegate> fetcher = [self fetcherForTask:downloadTask];
  [fetcher URLSession:session
         downloadTask:downloadTask
         didWriteData:bytesWritten
    totalBytesWritten:totalWritten
totalBytesExpectedToWrite:totalExpected];
}

- (void)URLSession:(NSURLSession *)session
      downloadTask:(NSURLSessionDownloadTask *)downloadTask
 didResumeAtOffset:(int64_t)fileOffset
expectedTotalBytes:(int64_t)expectedTotalBytes {
  id<NSURLSessionDownloadDelegate> fetcher = [self fetcherForTask:downloadTask];
  [fetcher URLSession:session
         downloadTask:downloadTask
    didResumeAtOffset:fileOffset
   expectedTotalBytes:expectedTotalBytes];
}

@end
