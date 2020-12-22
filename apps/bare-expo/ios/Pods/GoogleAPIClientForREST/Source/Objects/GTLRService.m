/* Copyright (c) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !__has_feature(objc_arc)
#error "This file needs to be compiled with ARC enabled."
#endif

#import <TargetConditionals.h>

#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#endif

#if !defined(GTLR_USE_FRAMEWORK_IMPORTS)
  #if defined(COCOAPODS) && COCOAPODS
    #define GTLR_USE_FRAMEWORK_IMPORTS 1
  #else
    #define GTLR_USE_FRAMEWORK_IMPORTS 0
  #endif
#endif

#if !defined(GTLR_USE_MODULE_IMPORTS)
  #if defined(SWIFT_PACKAGE) && SWIFT_PACKAGE
    #define GTLR_USE_MODULE_IMPORTS 1
  #else
    #define GTLR_USE_MODULE_IMPORTS 0
  #endif
#endif

#import "GTLRService.h"

#import "GTLRDefines.h"
#import "GTLRFramework.h"
#import "GTLRURITemplate.h"
#import "GTLRUtilities.h"

#if GTLR_USE_MODULE_IMPORTS
  @import GTMSessionFetcherCore;
  @import GTMSessionFetcherFull;
#elif GTLR_USE_FRAMEWORK_IMPORTS
  #import <GTMSessionFetcher/GTMSessionFetcher.h>
  #import <GTMSessionFetcher/GTMSessionFetcherService.h>
  #import <GTMSessionFetcher/GTMMIMEDocument.h>
#else
  #import "GTMSessionFetcher.h"
  #import "GTMSessionFetcherService.h"
  #import "GTMMIMEDocument.h"
#endif  // GTLR_USE_FRAMEWORK_IMPORTS


#ifndef STRIP_GTM_FETCH_LOGGING
  #error GTMSessionFetcher headers should have defaulted this if it wasn't already defined.
#endif

#ifndef GTLR_ASSERT_CURRENT_QUEUE_DEBUG
  #define GTLR_ASSERT_CURRENT_QUEUE_DEBUG(targetQueue)                  \
      GTLR_DEBUG_ASSERT(0 == strcmp(GTLR_QUEUE_NAME(targetQueue),       \
                        GTLR_QUEUE_NAME(DISPATCH_CURRENT_QUEUE_LABEL)), \
          @"Current queue is %s (expected %s)",                         \
          GTLR_QUEUE_NAME(DISPATCH_CURRENT_QUEUE_LABEL),                \
          GTLR_QUEUE_NAME(targetQueue))

  #define GTLR_QUEUE_NAME(queue) \
      (strlen(dispatch_queue_get_label(queue)) > 0 ? dispatch_queue_get_label(queue) : "unnamed")
#endif  // GTLR_ASSERT_CURRENT_QUEUE_DEBUG

NSString *const kGTLRServiceErrorDomain = @"com.google.GTLRServiceDomain";
NSString *const kGTLRErrorObjectDomain = @"com.google.GTLRErrorObjectDomain";
NSString *const kGTLRServiceErrorBodyDataKey = @"body";
NSString *const kGTLRServiceErrorContentIDKey = @"contentID";
NSString *const kGTLRStructuredErrorKey = @"GTLRStructuredError";
NSString *const kGTLRETagWildcard = @"*";

NSString *const kGTLRServiceTicketStartedNotification = @"kGTLRServiceTicketStartedNotification";
NSString *const kGTLRServiceTicketStoppedNotification = @"kGTLRServiceTicketStoppedNotification";
NSString *const kGTLRServiceTicketParsingStartedNotification = @"kGTLRServiceTicketParsingStartedNotification";
NSString *const kGTLRServiceTicketParsingStoppedNotification = @"kGTLRServiceTicketParsingStoppedNotification";

NSString *const kXIosBundleIdHeader = @"X-Ios-Bundle-Identifier";

static NSString *const kDeveloperAPIQueryParamKey = @"key";

static const NSUInteger kMaxNumberOfNextPagesFetched = 25;

static const NSUInteger kMaxGETURLLength = 2048;

// we'll enforce 50K chunks minimum just to avoid the server getting hit
// with too many small upload chunks
static const NSUInteger kMinimumUploadChunkSize = 50000;

// Helper to get the ETag if it is defined on an object.
static NSString *ETagIfPresent(GTLRObject *obj) {
  NSString *result = [obj.JSON objectForKey:@"etag"];
  return result;
}

// Merge two dictionaries. Either may be nil.
// If both are nil, return nil.
// In case of a key collision, values of the second dictionary prevail.
static NSDictionary *MergeDictionaries(NSDictionary *recessiveDict, NSDictionary *dominantDict) {
  if (!dominantDict) return recessiveDict;
  if (!recessiveDict) return dominantDict;

  NSMutableDictionary *worker = [recessiveDict mutableCopy];
  [worker addEntriesFromDictionary:dominantDict];
  return worker;
}

@interface GTLRServiceTicket ()

- (instancetype)initWithService:(GTLRService *)service
            executionParameters:(GTLRServiceExecutionParameters *)params NS_DESIGNATED_INITIALIZER;

// Thread safety: ticket properties are all publicly exposed as read-only.
//
// Service execution of a ticket is serial (started by the app, then executing on the fetcher
// callback queue and then the parse queue), so we don't need to worry about synchronization.
//
// One important exception is when the user invoked cancelTicket.  During cancellation, ticket
// properties are released. This should be harmless even during the fetch start-parse-callback
// phase because nothing released in cancelTicket is used to begin a fetch, and the cancellation
// flag will prevent any application callbacks from being invoked.
//
// The cancel and objectFetcher properties are synchronized on the ticket.

// Ticket properties exposed publicly as readonly.
@property(atomic, readwrite, nullable) id<GTLRQueryProtocol> originalQuery;
@property(atomic, readwrite, nullable) id<GTLRQueryProtocol> executingQuery;
@property(atomic, readwrite, nullable) GTMSessionFetcher *objectFetcher;
@property(nonatomic, readwrite, nullable) NSURLRequest *fetchRequest;
@property(nonatomic, readwrite, nullable) GTLRObject *postedObject;
@property(nonatomic, readwrite, nullable) GTLRObject *fetchedObject;
@property(nonatomic, readwrite, nullable) NSError *fetchError;
@property(nonatomic, readwrite) BOOL hasCalledCallback;
@property(nonatomic, readwrite) NSUInteger pagesFetchedCounter;
@property(readwrite, atomic, strong) id<GTLRObjectClassResolver> objectClassResolver;

// Internal properties copied from the service.
@property(nonatomic, assign) BOOL allowInsecureQueries;
@property(nonatomic, strong) GTMSessionFetcherService *fetcherService;
@property(nonatomic, strong, nullable) id<GTMFetcherAuthorizationProtocol> authorizer;

// Internal properties copied from serviceExecutionParameters.
@property(nonatomic, getter=isRetryEnabled) BOOL retryEnabled;
@property(nonatomic, readwrite) NSTimeInterval maxRetryInterval;
@property(nonatomic, strong, nullable) GTLRServiceRetryBlock retryBlock;
@property(nonatomic, strong, nullable) GTLRServiceUploadProgressBlock uploadProgressBlock;
@property(nonatomic, strong, nullable) GTLRServiceTestBlock testBlock;
@property(nonatomic, readwrite) BOOL shouldFetchNextPages;

// Internal properties used by the service.
#if GTM_BACKGROUND_TASK_FETCHING
// Access to backgroundTaskIdentifier should be protected by @synchronized(self).
@property(nonatomic, assign) UIBackgroundTaskIdentifier backgroundTaskIdentifier;
#endif  // GTM_BACKGROUND_TASK_FETCHING

// Dispatch group enabling waitForTicket: to delay until async callbacks and notifications
// related to the ticket have completed.
@property(nonatomic, readonly) dispatch_group_t callbackGroup;

// startBackgroundTask and endBackgroundTask do nothing if !GTM_BACKGROUND_TASK_FETCHING
- (void)startBackgroundTask;
- (void)endBackgroundTask;

- (void)notifyStarting:(BOOL)isStarting;
- (void)releaseTicketCallbacks;

// Posts a notification on the main queue using the ticket's dispatch group.
- (void)postNotificationOnMainThreadWithName:(NSString *)name
                                      object:(id)object
                                    userInfo:(NSDictionary *)userInfo;
@end

#if !defined(GTLR_HAS_SESSION_UPLOAD_FETCHER_IMPORT)
  #if defined(COCOAPODS) && COCOAPODS
    #define GTLR_HAS_SESSION_UPLOAD_FETCHER_IMPORT 1
  #else
    #define GTLR_HAS_SESSION_UPLOAD_FETCHER_IMPORT 0
  #endif
#endif

#if GTLR_HAS_SESSION_UPLOAD_FETCHER_IMPORT
 #if GTLR_USE_FRAMEWORK_IMPORTS
  #import <GTMSessionFetcher/GTMSessionUploadFetcher.h>
 #else
  #import "GTMSessionUploadFetcher.h"
 #endif // GTLR_USE_FRAMEWORK_IMPORTS
#else
// If the upload fetcher class is available, it can be used for chunked uploads
//
// We locally declare some methods of the upload fetcher so we
// do not need to import the header, as some projects may not have it available
#if !SWIFT_PACKAGE
@interface GTMSessionUploadFetcher : GTMSessionFetcher

+ (instancetype)uploadFetcherWithRequest:(NSURLRequest *)request
                          uploadMIMEType:(NSString *)uploadMIMEType
                               chunkSize:(int64_t)chunkSize
                          fetcherService:(GTM_NULLABLE GTMSessionFetcherService *)fetcherServiceOrNil;

+ (instancetype)uploadFetcherWithLocation:(NSURL *)uploadLocationURL
                           uploadMIMEType:(NSString *)uploadMIMEType
                                chunkSize:(int64_t)chunkSize
                           fetcherService:(GTM_NULLABLE GTMSessionFetcherService *)fetcherServiceOrNil;

@property(strong) NSURL *uploadLocationURL;
@property(strong) NSData *uploadData;
@property(strong) NSURL *uploadFileURL;
@property(strong) NSFileHandle *uploadFileHandle;

- (void)pauseFetching;
- (void)resumeFetching;
- (BOOL)isPaused;
@end
#endif  // !SWIFT_PACKAGE
#endif  // GTLR_HAS_SESSION_UPLOAD_FETCHER_IMPORT


@interface GTLRObject (StandardProperties)
// Common properties on GTLRObject that are invoked below.
@property(nonatomic, copy) NSString *nextPageToken;
@end

// This class encapsulates the pieces of a single batch response, including
// inner http response code and message, inner headers, JSON body (parsed as a dictionary),
// or parsing NSError.
//
// See responsePartsWithMIMEParts: for an example of the wire format data used
// to populate this object.
@interface GTLRBatchResponsePart : NSObject
@property(nonatomic, copy) NSString *contentID;
@property(nonatomic, assign) NSInteger statusCode;
@property(nonatomic, copy) NSString *statusString;
@property(nonatomic, strong) NSDictionary *headers;
@property(nonatomic, strong) NSDictionary *JSON;
@property(nonatomic, strong) NSError *parseError;
@end

@implementation GTLRBatchResponsePart
@synthesize   contentID = _contentID,
              headers = _headers,
              JSON = _JSON,
              parseError = _parseError,
              statusCode = _statusCode,
              statusString = _statusString;
#if DEBUG
- (NSString *)description {
  return [NSString stringWithFormat:@"%@ %p: %@\n%ld %@\nheaders:%@\nJSON:%@\nerror:%@",
          [self class], self, self.contentID, (long)self.statusCode, self.statusString,
          self.headers, self.JSON, self.parseError];
}
#endif
@end

// GTLRResourceURLQuery is an internal class used as a query object placeholder
// when fetchObjectWithURL: is invoked by the client app. This lets the service's
// plumbing treat the request like other queries, without allowing users to
// set arbitrary query properties that may not work as anticipated.
@interface GTLRResourceURLQuery : GTLRQuery

@property(nonatomic, strong, nullable) NSURL *resourceURL;

+ (instancetype)queryWithResourceURL:(NSURL *)resourceURL
                         objectClass:(nullable Class)objectClass;

@end

@implementation GTLRService {
  NSString *_userAgent;
  NSString *_overrideUserAgent;
  NSDictionary *_serviceProperties;  // Properties retained for the convenience of the client app.
  NSUInteger _uploadChunkSize;       // Only applies to resumable chunked uploads.
}

@synthesize additionalHTTPHeaders = _additionalHTTPHeaders,
            additionalURLQueryParameters = _additionalURLQueryParameters,
            allowInsecureQueries = _allowInsecureQueries,
            callbackQueue = _callbackQueue,
            APIKey = _apiKey,
            APIKeyRestrictionBundleID = _apiKeyRestrictionBundleID,
            batchPath = _batchPath,
            dataWrapperRequired = _dataWrapperRequired,
            fetcherService = _fetcherService,
            maxRetryInterval = _maxRetryInterval,
            parseQueue = _parseQueue,
            prettyPrintQueryParameterNames = _prettyPrintQueryParameterNames,
            resumableUploadPath = _resumableUploadPath,
            retryBlock = _retryBlock,
            retryEnabled = _retryEnabled,
            rootURLString = _rootURLString,
            servicePath = _servicePath,
            shouldFetchNextPages = _shouldFetchNextPages,
            simpleUploadPath = _simpleUploadPath,
            objectClassResolver = _objectClassResolver,
            testBlock = _testBlock,
            uploadProgressBlock = _uploadProgressBlock,
            userAgentAddition = _userAgentAddition;

+ (Class)ticketClass {
  return [GTLRServiceTicket class];
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _parseQueue = dispatch_queue_create("com.google.GTLRServiceParse", DISPATCH_QUEUE_SERIAL);
    _callbackQueue = dispatch_get_main_queue();
    _fetcherService = [[GTMSessionFetcherService alloc] init];

    // Make the session fetcher use a background delegate queue instead of bouncing
    // through the main queue for its callbacks from NSURLSession. This should improve
    // performance, and eventually be the default behavior for the fetcher.
    NSOperationQueue *delegateQueue = [[NSOperationQueue alloc] init];
    delegateQueue.maxConcurrentOperationCount = 1;
    delegateQueue.name = @"com.google.GTLRServiceFetcherDelegate";
    _fetcherService.sessionDelegateQueue = delegateQueue;

    NSDictionary<NSString *, Class> *kindMap = [[self class] kindStringToClassMap];
    _objectClassResolver = [GTLRObjectClassResolver resolverWithKindMap:kindMap];
  }
  return self;
}

- (NSString *)requestUserAgent {
  if (_overrideUserAgent != nil) {
    return _overrideUserAgent;
  }

  NSString *userAgent = self.userAgent;
  if (userAgent.length == 0) {
    // The service instance is missing an explicit user-agent; use the bundle ID
    // or process name.  Don't use the bundle ID of the library's framework.
    NSBundle *owningBundle = [NSBundle bundleForClass:[self class]];
    if (owningBundle == nil
        || [owningBundle.bundleIdentifier isEqual:@"com.google.GTLR"]) {
      owningBundle = [NSBundle mainBundle];
    }
    userAgent = GTMFetcherApplicationIdentifier(owningBundle);
  }

  NSString *requestUserAgent = userAgent;

  // if the user agent already specifies the library version, we'll
  // use it verbatim in the request
  NSString *libraryString = @"google-api-objc-client";
  NSRange libRange = [userAgent rangeOfString:libraryString
                                      options:NSCaseInsensitiveSearch];
  if (libRange.location == NSNotFound) {
    // the user agent doesn't specify the client library, so append that
    // information, and the system version
    NSString *libVersionString = GTLRFrameworkVersionString();

    NSString *systemString = GTMFetcherSystemVersionString();

    // We don't clean this with GTMCleanedUserAgentString so spaces are
    // preserved
    NSString *userAgentAddition = self.userAgentAddition;
    NSString *customString = userAgentAddition ?
      [@" " stringByAppendingString:userAgentAddition] : @"";

    // Google servers look for gzip in the user agent before sending gzip-
    // encoded responses.  See Service.java
    requestUserAgent = [NSString stringWithFormat:@"%@ %@/%@ %@%@ (gzip)",
      userAgent, libraryString, libVersionString, systemString, customString];
  }
  return requestUserAgent;
}

- (void)setMainBundleIDRestrictionWithAPIKey:(NSString *)apiKey {
  self.APIKey = apiKey;
  self.APIKeyRestrictionBundleID = [[NSBundle mainBundle] bundleIdentifier];
}

- (NSMutableURLRequest *)requestForURL:(NSURL *)url
                                  ETag:(NSString *)etag
                            httpMethod:(NSString *)httpMethod
                                ticket:(GTLRServiceTicket *)ticket {

  // subclasses may add headers to this
  NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:url
                                                              cachePolicy:NSURLRequestReloadIgnoringCacheData
                                                          timeoutInterval:60];
  NSString *requestUserAgent = self.requestUserAgent;
  [request setValue:requestUserAgent forHTTPHeaderField:@"User-Agent"];

  if (httpMethod.length > 0) {
    [request setHTTPMethod:httpMethod];
  }

  if (etag.length > 0) {

    // it's rather unexpected for an etagged object to be provided for a GET,
    // but we'll check for an etag anyway, similar to HttpGDataRequest.java,
    // and if present use it to request only an unchanged resource

    BOOL isDoingHTTPGet = (httpMethod == nil
               || [httpMethod caseInsensitiveCompare:@"GET"] == NSOrderedSame);

    if (isDoingHTTPGet) {

      // set the etag header, even if weak, indicating we don't want
      // another copy of the resource if it's the same as the object
      [request setValue:etag forHTTPHeaderField:@"If-None-Match"];

    } else {

      // if we're doing PUT or DELETE, set the etag header indicating
      // we only want to update the resource if our copy matches the current
      // one (unless the etag is weak and so shouldn't be a constraint at all)
      BOOL isWeakETag = [etag hasPrefix:@"W/"];

      BOOL isModifying =
        [httpMethod caseInsensitiveCompare:@"PUT"] == NSOrderedSame
        || [httpMethod caseInsensitiveCompare:@"DELETE"] == NSOrderedSame
        || [httpMethod caseInsensitiveCompare:@"PATCH"] == NSOrderedSame;

      if (isModifying && !isWeakETag) {
        [request setValue:etag forHTTPHeaderField:@"If-Match"];
      }
    }
  }

  return request;
}

// objectRequestForURL returns an NSMutableURLRequest for a GTLRObject
//
// the object is the object being sent to the server, or nil;
// the http method may be nil for get, or POST, PUT, DELETE

- (NSMutableURLRequest *)objectRequestForURL:(NSURL *)url
                                      object:(GTLRObject *)object
                                 contentType:(NSString *)contentType
                               contentLength:(NSString *)contentLength
                                        ETag:(NSString *)etag
                                  httpMethod:(NSString *)httpMethod
                           additionalHeaders:(NSDictionary *)additionalHeaders
                                      ticket:(GTLRServiceTicket *)ticket {
  if (object) {
    // if the object being sent has an etag, add it to the request header to
    // avoid retrieving a duplicate or to avoid writing over an updated
    // version of the resource on the server
    //
    // Typically, delete requests will provide an explicit ETag parameter, and
    // other requests will have the ETag carried inside the object being updated
    if (etag == nil) {
      etag = ETagIfPresent(object);
    }
  }

  NSMutableURLRequest *request = [self requestForURL:url
                                                ETag:etag
                                          httpMethod:httpMethod
                                              ticket:ticket];
  [request setValue:@"application/json" forHTTPHeaderField:@"Accept"];
  [request setValue:contentType forHTTPHeaderField:@"Content-Type"];

  [request setValue:@"no-cache" forHTTPHeaderField:@"Cache-Control"];

  if (contentLength) {
    [request setValue:contentLength forHTTPHeaderField:@"Content-Length"];
  }

  // Add the additional http headers from the service, and then from the query
  NSDictionary *headers = self.additionalHTTPHeaders;
  for (NSString *key in headers) {
    NSString *value = [headers objectForKey:key];
    [request setValue:value forHTTPHeaderField:key];
  }

  headers = additionalHeaders;
  for (NSString *key in headers) {
    NSString *value = [headers objectForKey:key];
    [request setValue:value forHTTPHeaderField:key];
  }

  return request;
}

#pragma mark -

- (NSMutableURLRequest *)requestForQuery:(GTLRQuery *)query {
  GTLR_DEBUG_ASSERT(query.bodyObject == nil,
                    @"requestForQuery: supports only GET methods, but was passed: %@", query);
  GTLR_DEBUG_ASSERT(query.uploadParameters == nil,
                    @"requestForQuery: does not support uploads, but was passed: %@", query);

  NSURL *url = [self URLFromQueryObject:query
                        usePartialPaths:NO
           includeServiceURLQueryParams:YES];

  // If there is a developer key, add it onto the url.
  NSString *apiKey = self.APIKey;
  if (apiKey.length > 0) {
    NSDictionary *queryParameters;
    queryParameters = @{ kDeveloperAPIQueryParamKey : apiKey };
    url = [GTLRService URLWithString:url.absoluteString
                     queryParameters:queryParameters];
  }

  NSMutableURLRequest *request = [self requestForURL:url
                                                ETag:nil
                                          httpMethod:query.httpMethod
                                              ticket:nil];
  NSString *apiRestriction = self.APIKeyRestrictionBundleID;
  if ([apiRestriction length] > 0) {
    [request setValue:apiRestriction forHTTPHeaderField:kXIosBundleIdHeader];
  }

  NSDictionary *headers = self.additionalHTTPHeaders;
  for (NSString *key in headers) {
    NSString *value = [headers objectForKey:key];
    [request setValue:value forHTTPHeaderField:key];
  }

  headers = query.additionalHTTPHeaders;
  for (NSString *key in headers) {
    NSString *value = [headers objectForKey:key];
    [request setValue:value forHTTPHeaderField:key];
  }

  return request;
}

// common fetch starting method

- (GTLRServiceTicket *)fetchObjectWithURL:(NSURL *)targetURL
                              objectClass:(Class)objectClass
                               bodyObject:(GTLRObject *)bodyObject
                               dataToPost:(NSData *)dataToPost
                                     ETag:(NSString *)etag
                               httpMethod:(NSString *)httpMethod
                             mayAuthorize:(BOOL)mayAuthorize
                        completionHandler:(GTLRServiceCompletionHandler)completionHandler
                           executingQuery:(id<GTLRQueryProtocol>)executingQuery
                                   ticket:(GTLRServiceTicket *)ticket {
  // Once inside this method, we should not access any service properties that may reasonably
  // be changed by the app, as this method may execute multiple times during query execution
  // and we want consistent behavior.  Service properties should be copied to the ticket.

  GTLR_DEBUG_ASSERT(executingQuery != nil,
                    @"no query? service additionalURLQueryParameters needs to be added to targetURL");

  GTLR_DEBUG_ASSERT(targetURL != nil, @"no url?");
  if (targetURL == nil) return nil;

  BOOL hasExecutionParams = [executingQuery hasExecutionParameters];
  GTLRServiceExecutionParameters *executionParams = (hasExecutionParams ?
                                                     executingQuery.executionParameters : nil);

  // We need to create a ticket unless one was created earlier (like during authentication.)
  if (!ticket) {
    ticket = [[[[self class] ticketClass] alloc] initWithService:self
                                             executionParameters:executionParams];
    [ticket notifyStarting:YES];
  }

  // If there is a developer key, add it onto the URL.
  NSString *apiKey = ticket.APIKey;
  if (apiKey.length > 0) {
    NSDictionary *queryParameters;
    queryParameters = @{ kDeveloperAPIQueryParamKey : apiKey };
    targetURL = [GTLRService URLWithString:targetURL.absoluteString
                           queryParameters:queryParameters];
  }

  NSString *contentType = @"application/json; charset=utf-8";
  NSString *contentLength;  // nil except for single-request uploads.

  if ([executingQuery isBatchQuery]) {
    contentType = [NSString stringWithFormat:@"multipart/mixed; boundary=%@",
                   ((GTLRBatchQuery *)executingQuery).boundary];
  }


  GTLRUploadParameters *uploadParams = executingQuery.uploadParameters;

  if (uploadParams.shouldUploadWithSingleRequest) {
    NSData *uploadData = uploadParams.data;
    NSString *uploadMIMEType = uploadParams.MIMEType;
    if (!uploadData) {
      GTLR_DEBUG_ASSERT(0, @"Uploading with a single request requires bytes to upload as NSData");
    } else {
      if (uploadParams.shouldSendUploadOnly) {
        contentType = uploadMIMEType;
        dataToPost = uploadData;
        contentLength = @(dataToPost.length).stringValue;
      } else {
        GTMMIMEDocument *mimeDoc = [GTMMIMEDocument MIMEDocument];
        if (dataToPost) {
          // Include the object as metadata with the upload.
          [mimeDoc addPartWithHeaders:@{ @"Content-Type" : contentType }
                                 body:dataToPost];
        }
        [mimeDoc addPartWithHeaders:@{ @"Content-Type" : uploadMIMEType }
                               body:uploadData];

        dispatch_data_t mimeDispatchData;
        unsigned long long mimeLength;
        NSString *mimeBoundary;
        [mimeDoc generateDispatchData:&mimeDispatchData
                               length:&mimeLength
                             boundary:&mimeBoundary];

        contentType = [NSString stringWithFormat:@"multipart/related; boundary=%@", mimeBoundary];
        dataToPost = (NSData *)mimeDispatchData;
        contentLength = @(mimeLength).stringValue;
      }
    }
  }

  NSDictionary *additionalHeaders = nil;
  NSString *restriction = self.APIKeyRestrictionBundleID;
  if ([restriction length] > 0) {
    additionalHeaders = @{ kXIosBundleIdHeader : restriction };
  }

  NSDictionary *queryAdditionalHeaders = executingQuery.additionalHTTPHeaders;
  if (queryAdditionalHeaders) {
    if (additionalHeaders) {
      NSMutableDictionary *builder = [additionalHeaders mutableCopy];
      [builder addEntriesFromDictionary:queryAdditionalHeaders];
      additionalHeaders = builder;
    } else {
      additionalHeaders = queryAdditionalHeaders;
    }
  }

  NSURLRequest *request = [self objectRequestForURL:targetURL
                                             object:bodyObject
                                        contentType:contentType
                                      contentLength:contentLength
                                               ETag:etag
                                         httpMethod:httpMethod
                                  additionalHeaders:additionalHeaders
                                             ticket:ticket];
  ticket.postedObject = bodyObject;
  ticket.executingQuery = executingQuery;

  GTLRQuery *originalQuery = (GTLRQuery *)ticket.originalQuery;
  if (originalQuery == nil) {
    originalQuery = (GTLRQuery *)executingQuery;
    ticket.originalQuery = originalQuery;
  }

  // Some proxy servers (and some web servers) have issues with GET URLs being
  // too long, trap that and move the query parameters into the body. The
  // uploadParams and dataToPost should be nil for a GET, but playing it safe
  // and confirming.
  NSString *requestHTTPMethod = request.HTTPMethod;
  BOOL isDoingHTTPGet =
      (requestHTTPMethod == nil
       || [requestHTTPMethod caseInsensitiveCompare:@"GET"] == NSOrderedSame);
  if (isDoingHTTPGet &&
      (request.URL.absoluteString.length >= kMaxGETURLLength) &&
      (uploadParams == nil) &&
      (dataToPost == nil)) {
    NSString *urlString = request.URL.absoluteString;
    NSRange range = [urlString rangeOfString:@"?"];
    if (range.location != NSNotFound) {
      NSURL *trimmedURL = [NSURL URLWithString:[urlString substringToIndex:range.location]];
      NSString *urlArgsString = [urlString substringFromIndex:(range.location + 1)];
      if (trimmedURL && (urlArgsString.length > 0)) {
        dataToPost = [urlArgsString dataUsingEncoding:NSUTF8StringEncoding];
        NSMutableURLRequest *mutableRequest = [request mutableCopy];
        mutableRequest.URL = trimmedURL;
        mutableRequest.HTTPMethod = @"POST";
        [mutableRequest setValue:@"GET" forHTTPHeaderField:@"X-HTTP-Method-Override"];
        [mutableRequest setValue:@"application/x-www-form-urlencoded"
              forHTTPHeaderField:@"Content-Type"];
        [mutableRequest setValue:@(dataToPost.length).stringValue
              forHTTPHeaderField:@"Content-Length"];
        request = mutableRequest;
      }
    }
  }
  ticket.fetchRequest = request;

  GTLRServiceTestBlock testBlock = ticket.testBlock;
  if (testBlock) {
    [self simulateFetchWithTicket:ticket
                        testBlock:testBlock
                       dataToPost:dataToPost
                completionHandler:completionHandler];
    return ticket;
  }

  GTMSessionFetcherService *fetcherService = ticket.fetcherService;
  GTMSessionFetcher *fetcher;

  if (uploadParams == nil || uploadParams.shouldUploadWithSingleRequest) {
    // Create a single-request fetcher.
    fetcher = [fetcherService fetcherWithRequest:request];
  } else {
    fetcher = [self uploadFetcherWithRequest:request
                              fetcherService:fetcherService
                                      params:uploadParams];
  }

  if (ticket.allowInsecureQueries) {
    fetcher.allowLocalhostRequest = YES;
    fetcher.allowedInsecureSchemes = @[ @"http" ];
  }

  NSString *loggingName = executingQuery.loggingName;
  if (loggingName.length > 0) {
    NSUInteger pageNumber = ticket.pagesFetchedCounter + 1;
    if (pageNumber > 1) {
      loggingName = [loggingName stringByAppendingFormat:@", page %lu",
                     (unsigned long)pageNumber];
    }
    fetcher.comment = loggingName;
  }

  if (!mayAuthorize) {
    fetcher.authorizer = nil;
  } else {
    fetcher.authorizer = ticket.authorizer;
  }

  // copy the ticket's retry settings into the fetcher
  fetcher.retryEnabled = ticket.retryEnabled;
  fetcher.maxRetryInterval = ticket.maxRetryInterval;

  BOOL shouldExamineRetries = (ticket.retryBlock != nil);
  if (shouldExamineRetries) {
    GTLR_DEBUG_ASSERT(ticket.retryEnabled, @"Setting retry block without retry enabled.");

    fetcher.retryBlock = ^(BOOL suggestedWillRetry, NSError *error,
                           GTMSessionFetcherRetryResponse response) {
      // The object fetcher may call into this retry block; this one invokes the
      // selector provided by the user.
      GTLRServiceRetryBlock retryBlock = ticket.retryBlock;
      if (!retryBlock) {
        response(suggestedWillRetry);
      } else {
        dispatch_group_async(ticket.callbackGroup, ticket.callbackQueue, ^{
          if (ticket.cancelled) {
            response(NO);
            return;
          }
          BOOL willRetry = retryBlock(ticket, suggestedWillRetry, error);
          response(willRetry);
        });
      }
    };
  }

  // Remember the object fetcher in the ticket.
  ticket.objectFetcher = fetcher;

  // Set the upload data.
  fetcher.bodyData = dataToPost;

  // Have the fetcher call back on the parse queue.
  fetcher.callbackQueue = self.parseQueue;

  // If this ticket is paging, end any ongoing background task immediately, and
  // rely on the fetcher's background task now instead.
  [ticket endBackgroundTask];

  [fetcher beginFetchWithCompletionHandler:^(NSData * _Nullable data, NSError * _Nullable error) {
    // We now have the JSON data for an object, or an error.
    GTLR_ASSERT_CURRENT_QUEUE_DEBUG(self.parseQueue);

    // Until now, the only async operation has been the fetch, and we rely on the fetcher's
    // background task on iOS to get us here if the app was backgrounded.
    //
    // Now we'll let the ticket create a background task so that the async parsing and call back to
    // the app will happen if the app is sent to the background. The ticket is responsible for
    // ending the background task.
    [ticket startBackgroundTask];

    if (ticket.cancelled) {
      // If the user cancels the ticket, then cancelTicket will stop the fetcher so this
      // callback probably won't occur.
      //
      // But just for safety, if we get here, skip any parsing steps by fabricating an error.
      data = nil;
      error = [NSError errorWithDomain:NSURLErrorDomain
                                  code:NSURLErrorCancelled
                              userInfo:nil];
    }

    if (error == nil) {
      // Successful fetch.
      if (data.length > 0) {
        [self prepareToParseObjectForFetcher:fetcher
                              executingQuery:executingQuery
                                      ticket:ticket
                                       error:error
                                defaultClass:objectClass
                           completionHandler:completionHandler];
      } else {
        // no data (such as when deleting)
        [self handleParsedObjectForFetcher:fetcher
                            executingQuery:executingQuery
                                    ticket:ticket
                                     error:nil
                              parsedObject:nil
           hasSentParsingStartNotification:NO
                         completionHandler:completionHandler];
      }
      return;
    }

    // Failed fetch.
    NSInteger status = [error code];
    if (status >= 300) {
      // Return the HTTP error status code along with a more descriptive error
      // from within the HTTP response payload.
      NSData *responseData = fetcher.downloadedData;
      if (responseData.length > 0) {
        NSDictionary *responseHeaders = fetcher.responseHeaders;
        NSString *responseContentType = [responseHeaders objectForKey:@"Content-Type"];

        if (data.length > 0) {
          if ([responseContentType hasPrefix:@"application/json"]) {
            NSError *parseError = nil;
            NSMutableDictionary *jsonWrapper =
                [NSJSONSerialization JSONObjectWithData:(NSData * _Nonnull)data
                                                options:NSJSONReadingMutableContainers
                                                  error:&parseError];
            // If the json parse worked, then extract potentially better
            // information.
            if (!parseError) {
              // HTTP Streaming defined by Google services is is an array
              // of requests and replies. This code never makes one of
              // these requests; but, some GET apis can actually be to
              // a Streaming result (for media?), so the errors can still
              // come back in an array.
              if ([jsonWrapper isKindOfClass:[NSArray class]]) {
                NSArray *jsonWrapperAsArray = (NSArray *)jsonWrapper;
#if DEBUG
                if (jsonWrapperAsArray.count > 1) {
                  GTLR_DEBUG_LOG(@"Got error array with >1 item, only using first. Full list: %@",
                                 jsonWrapperAsArray);
                }
#endif
                // Use the first.
                jsonWrapper = [jsonWrapperAsArray firstObject];
              }

              // Convert the JSON error payload into a structured error
              NSMutableDictionary *errorJSON = [jsonWrapper valueForKey:@"error"];
              if (errorJSON) {
                GTLRErrorObject *errorObject = [GTLRErrorObject objectWithJSON:errorJSON];
                error = [errorObject foundationError];
              }
            }
          } else {
            // No structured JSON error was available; make a plaintext server
            // error response visible in the error object.
            NSString *reasonStr = [[NSString alloc] initWithData:(NSData * _Nonnull)data
                                                        encoding:NSUTF8StringEncoding];
            NSDictionary *userInfo = @{ NSLocalizedDescriptionKey : reasonStr };
            error = [NSError errorWithDomain:kGTMSessionFetcherStatusDomain
                                        code:status
                                    userInfo:userInfo];
          }
        } else {
          // Response data length is zero; we'll settle for returning the
          // fetcher's error.
        }
      }
    }

    [self handleParsedObjectForFetcher:fetcher
                        executingQuery:executingQuery
                                ticket:ticket
                                 error:error
                          parsedObject:nil
       hasSentParsingStartNotification:NO
                     completionHandler:completionHandler];
  }];  // fetcher completion handler

  // If something weird happens and the networking callbacks have been called
  // already synchronously, we don't want to return the ticket since the caller
  // will never know when to stop retaining it, so we'll make sure the
  // success/failure callbacks have not yet been called by checking the
  // ticket
  if (ticket.hasCalledCallback) {
    return nil;
  }

  return ticket;
}

- (GTMSessionUploadFetcher *)uploadFetcherWithRequest:(NSURLRequest *)request
                                       fetcherService:(GTMSessionFetcherService *)fetcherService
                                               params:(GTLRUploadParameters *)uploadParams {
  // Hang on to the user's requested chunk size, and ensure it's not tiny
  NSUInteger uploadChunkSize = [self serviceUploadChunkSize];
  if (uploadChunkSize < kMinimumUploadChunkSize) {
    uploadChunkSize = kMinimumUploadChunkSize;
  }

  NSString *uploadClassName = GTLR_CLASSNAME_STR(GTMSessionUploadFetcher);
  Class uploadClass = NSClassFromString(uploadClassName);
  GTLR_ASSERT(uploadClass != nil, @"GTMSessionUploadFetcher needed");

  NSString *uploadMIMEType = uploadParams.MIMEType;
  NSData *uploadData = uploadParams.data;
  NSURL *uploadFileURL = uploadParams.fileURL;
  NSFileHandle *uploadFileHandle = uploadParams.fileHandle;
  NSURL *uploadLocationURL = uploadParams.uploadLocationURL;

  // Create the upload fetcher.
  GTMSessionUploadFetcher *fetcher;
  if (uploadLocationURL) {
    // Resuming with the session fetcher and a file URL.
    GTLR_DEBUG_ASSERT(uploadFileURL != nil, @"Resume requires a file URL");
    fetcher = [uploadClass uploadFetcherWithLocation:uploadLocationURL
                                      uploadMIMEType:uploadMIMEType
                                           chunkSize:(int64_t)uploadChunkSize
                                      fetcherService:fetcherService];
    fetcher.uploadFileURL = uploadFileURL;
  } else {
    fetcher = [uploadClass uploadFetcherWithRequest:request
                                     uploadMIMEType:uploadMIMEType
                                          chunkSize:(int64_t)uploadChunkSize
                                     fetcherService:fetcherService];
    if (uploadFileURL) {
      fetcher.uploadFileURL = uploadFileURL;
    } else if (uploadData) {
      fetcher.uploadData = uploadData;
    } else if (uploadFileHandle) {
#if DEBUG
      if (uploadParams.useBackgroundSession) {
        GTLR_DEBUG_LOG(@"Warning: GTLRUploadParameters should be supplied an uploadFileURL rather"
                       @" than a file handle to support background uploads.\n  %@", uploadParams);
      }
#endif
      fetcher.uploadFileHandle = uploadFileHandle;
    }
  }
  fetcher.useBackgroundSession = uploadParams.useBackgroundSession;
  return fetcher;
}

#pragma mark -

- (GTLRServiceTicket *)executeBatchQuery:(GTLRBatchQuery *)batchObj
                       completionHandler:(GTLRServiceCompletionHandler)completionHandler
                                  ticket:(GTLRServiceTicket *)ticket {
  // Copy the original batch object and each query inside so our working queries cannot be modified
  // by the caller, and release the callback blocks from the supplied query objects.
  GTLRBatchQuery *batchCopy = [batchObj copy];
  [batchObj invalidateQuery];

  NSArray *queries = batchCopy.queries;
  NSUInteger numberOfQueries = queries.count;
  if (numberOfQueries == 0) return nil;

  // Create the batch of REST calls.
  NSMutableSet *requestIDs = [NSMutableSet setWithCapacity:numberOfQueries];
  NSMutableSet *loggingNames = [NSMutableSet set];
  GTMMIMEDocument *mimeDoc = [GTMMIMEDocument MIMEDocument];

  // Each batch part has two "header" sections, an outer and inner.
  // The inner headers are preceded by a line specifying the http request.
  // So a part looks like this:
  //
  //   --END_OF_PART
  //   Content-ID: gtlr_3
  //   Content-Transfer-Encoding: binary
  //   Content-Type: application/http
  //
  //   POST https://www.googleapis.com/drive/v3/files/
  //   Content-Length: 0
  //   Content-Type: application/json
  //
  //   {
  //     "id": "04109509152946699072k"
  //   }

  for (GTLRQuery *query in queries) {
    GTLRObject *bodyObject = query.bodyObject;
    NSDictionary *bodyJSON = bodyObject.JSON;
    NSString *requestID = query.requestID;

    if (requestID.length == 0) {
      GTLR_DEBUG_ASSERT(0, @"Invalid query ID: %@", [query class]);
      return nil;
    }

    if ([requestIDs containsObject:requestID]) {
      GTLR_DEBUG_ASSERT(0, @"Duplicate request ID in batch: %@", requestID);
      return nil;
    }
    [requestIDs addObject:requestID];

    // Create the inner request, body, and headers.

    NSURL *requestURL = [self URLFromQueryObject:query
                                 usePartialPaths:YES
                    includeServiceURLQueryParams:NO];
    NSString *requestURLString = requestURL.absoluteString;

    NSError *error = nil;
    NSData *bodyData;
    if (bodyJSON) {
      bodyData = [NSJSONSerialization dataWithJSONObject:bodyJSON
                                                 options:0
                                                   error:&error];
      if (bodyData == nil) {
        GTLR_DEBUG_ASSERT(0, @"JSON generation error: %@\n JSON: %@", error, bodyJSON);
        return nil;
      }
    }

    NSString *httpRequestString = [NSString stringWithFormat:@"%@ %@\r\n",
                                   query.httpMethod ?: @"GET", requestURLString];
    NSDictionary *innerPartHeaders = @{ @"Content-Type" : @"application/json",
                                        @"Content-Length" : @(bodyData.length).stringValue };

    innerPartHeaders = MergeDictionaries(query.additionalHTTPHeaders, innerPartHeaders);

    NSData *innerPartHeadersData = [GTMMIMEDocument dataWithHeaders:innerPartHeaders];

    NSMutableData *innerData =
        [[httpRequestString dataUsingEncoding:NSUTF8StringEncoding] mutableCopy];
    [innerData appendData:innerPartHeadersData];
    if (bodyData) {
      [innerData appendData:bodyData];
    }

    // Combine the outer headers with the inner headers and body data.
    NSDictionary *outerPartHeaders = @{ @"Content-Type" : @"application/http",
                                        @"Content-ID" : requestID,
                                        @"Content-Transfer-Encoding" : @"binary" };

    [mimeDoc addPartWithHeaders:outerPartHeaders
                           body:innerData];

    NSString *loggingName = query.loggingName ?: [[query class] description];
    [loggingNames addObject:loggingName];
  }

#if !STRIP_GTM_FETCH_LOGGING
  // Set the fetcher log comment.
  if (!batchCopy.loggingName) {
    NSUInteger pageNumber = ticket.pagesFetchedCounter;
    NSString *pageStr = @"";
    if (pageNumber > 0) {
      pageStr = [NSString stringWithFormat:@"page %lu, ",
                 (unsigned long)(pageNumber + 1)];
    }
    batchCopy.loggingName = [NSString stringWithFormat:@"batch: %@ (%@%lu queries)",
                             [loggingNames.allObjects componentsJoinedByString:@", "],
                             pageStr, (unsigned long)numberOfQueries];
  }
#endif

  dispatch_data_t mimeDispatchData;
  unsigned long long mimeLength;
  NSString *mimeBoundary;
  [mimeDoc generateDispatchData:&mimeDispatchData
                         length:&mimeLength
                       boundary:&mimeBoundary];

  batchCopy.boundary = mimeBoundary;

  BOOL mayAuthorize = (batchCopy ? !batchCopy.shouldSkipAuthorization : YES);

  NSString *rootURLString = self.rootURLString;
  NSString *batchPath = self.batchPath ?: @"";
  NSString *batchURLString = [rootURLString stringByAppendingString:batchPath];

  GTLR_DEBUG_ASSERT(![batchPath hasPrefix:@"/"],
                    @"batchPath shouldn't start with a slash: %@",
                    batchPath);

  // Query parameters override service parameters.
  NSDictionary *mergedQueryParams = MergeDictionaries(self.additionalURLQueryParameters,
                                                      batchObj.additionalURLQueryParameters);
  NSURL *batchURL;
  if (mergedQueryParams.count > 0) {
    batchURL = [GTLRService URLWithString:batchURLString
                          queryParameters:mergedQueryParams];
  } else {
    batchURL = [NSURL URLWithString:batchURLString];
  }

  GTLRServiceTicket *resultTicket = [self fetchObjectWithURL:batchURL
                                                 objectClass:[GTLRBatchResult class]
                                                  bodyObject:nil
                                                  dataToPost:(NSData *)mimeDispatchData
                                                        ETag:nil
                                                  httpMethod:@"POST"
                                                mayAuthorize:mayAuthorize
                                           completionHandler:completionHandler
                                              executingQuery:batchCopy
                                                      ticket:ticket];
  return resultTicket;
}

#pragma mark -

// Raw REST fetch method.

- (GTLRServiceTicket *)fetchObjectWithURL:(NSURL *)targetURL
                              objectClass:(Class)objectClass
                               bodyObject:(GTLRObject *)bodyObject
                                     ETag:(NSString *)etag
                               httpMethod:(NSString *)httpMethod
                             mayAuthorize:(BOOL)mayAuthorize
                        completionHandler:(GTLRServiceCompletionHandler)completionHandler
                           executingQuery:(id<GTLRQueryProtocol>)executingQuery
                                   ticket:(GTLRServiceTicket *)ticket {
  // if no URL was supplied, treat this as if the fetch failed (below)
  // and immediately return a nil ticket, skipping the callbacks
  //
  // this might be considered normal (say, updating a read-only entry
  // that lacks an edit link) though higher-level calls may assert or
  // return errors depending on the specific usage
  if (targetURL == nil) return nil;

  NSData *dataToPost = nil;
  if (bodyObject != nil && !executingQuery.uploadParameters.shouldSendUploadOnly) {
    NSError *error = nil;

    NSDictionary *whatToSend;
    NSDictionary *json = bodyObject.JSON;
    if (json == nil) {
      // Since a body object was provided, we'll ensure there's at least an empty dictionary.
      json = [NSDictionary dictionary];
    }
    if (_dataWrapperRequired) {
      // create the top-level "data" object
      whatToSend = @{ @"data" : json };
    } else {
      whatToSend = json;
    }
    dataToPost = [NSJSONSerialization dataWithJSONObject:whatToSend
                                                 options:0
                                                   error:&error];
    if (dataToPost == nil) {
      GTLR_DEBUG_LOG(@"JSON generation error: %@", error);
    }
  }

  return [self fetchObjectWithURL:targetURL
                      objectClass:objectClass
                       bodyObject:bodyObject
                       dataToPost:dataToPost
                             ETag:etag
                       httpMethod:httpMethod
                     mayAuthorize:mayAuthorize
                completionHandler:completionHandler
                   executingQuery:executingQuery
                           ticket:ticket];
}

- (void)invokeProgressCallbackForTicket:(GTLRServiceTicket *)ticket
                         deliveredBytes:(unsigned long long)numReadSoFar
                             totalBytes:(unsigned long long)total {

  GTLRServiceUploadProgressBlock block = ticket.uploadProgressBlock;
  if (block) {
    dispatch_group_async(ticket.callbackGroup, ticket.callbackQueue, ^{
      if (ticket.cancelled) return;

      block(ticket, numReadSoFar, total);
    });
  }
}

// Three methods handle parsing of the fetched JSON data:
//   - prepareToParse posts a start notification and then spawns off parsing
//     on the operation queue (if there's an operation queue)
//   - parseObject does the parsing of the JSON string
//   - handleParsedObject posts the stop notification and calls the callback
//     with the parsed object or an error
//
// The middle method may run on a separate thread.

- (void)prepareToParseObjectForFetcher:(GTMSessionFetcher *)fetcher
                        executingQuery:(id<GTLRQueryProtocol>)executingQuery
                                ticket:(GTLRServiceTicket *)ticket
                                 error:(NSError *)error
                          defaultClass:(Class)defaultClass
                     completionHandler:(GTLRServiceCompletionHandler)completionHandler {
  GTLR_ASSERT_CURRENT_QUEUE_DEBUG(self.parseQueue);

  [ticket postNotificationOnMainThreadWithName:kGTLRServiceTicketParsingStartedNotification
                                        object:ticket
                                      userInfo:nil];

  // For unit tests to cancel during parsing, we need a synchronous notification posted.
  // Because this notification is intended only for unit tests, there is no public symbol
  // for the notification name.
  NSNotificationCenter *nc =[NSNotificationCenter defaultCenter];
  [nc postNotificationName:@"kGTLRServiceTicketParsingStartedForTestNotification"
                    object:ticket
                  userInfo:nil];

  NSDictionary *batchClassMap;
  if ([executingQuery isBatchQuery]) {
    // build a dictionary of expected classes for the batch responses
    GTLRBatchQuery *batchQuery = (GTLRBatchQuery *)executingQuery;
    NSArray *queries = batchQuery.queries;
    batchClassMap = [NSMutableDictionary dictionaryWithCapacity:queries.count];
    for (GTLRQuery *singleQuery in queries) {
      [batchClassMap setValue:singleQuery.expectedObjectClass
                       forKey:singleQuery.requestID];
    }
  }

  [self parseObjectFromDataOfFetcher:fetcher
                      executingQuery:executingQuery
                              ticket:ticket
                               error:error
                        defaultClass:defaultClass
                       batchClassMap:batchClassMap
     hasSentParsingStartNotification:YES
                   completionHandler:completionHandler];
}

- (void)parseObjectFromDataOfFetcher:(GTMSessionFetcher *)fetcher
                      executingQuery:(id<GTLRQueryProtocol>)executingQuery
                              ticket:(GTLRServiceTicket *)ticket
                               error:(NSError *)error
                        defaultClass:(Class)defaultClass
                       batchClassMap:(NSDictionary *)batchClassMap
     hasSentParsingStartNotification:(BOOL)hasSentParsingStartNotification
                   completionHandler:(GTLRServiceCompletionHandler)completionHandler {
  GTLR_ASSERT_CURRENT_QUEUE_DEBUG(self.parseQueue);

  NSError *fetchError = error;

  NSString *downloadAsDataObjectType = nil;
  if (![executingQuery isBatchQuery]) {
    GTLRQuery *singleQuery = (GTLRQuery *)executingQuery;
    downloadAsDataObjectType = singleQuery.downloadAsDataObjectType;
  }

  NSDictionary *responseHeaders = fetcher.responseHeaders;
  NSString *contentType = [responseHeaders objectForKey:@"Content-Type"];
  NSData *data = fetcher.downloadedData;
  BOOL hasData = data.length > 0;
  BOOL isJSON = [contentType hasPrefix:@"application/json"];
  GTLRObject *parsedObject;

  if (hasData) {
#if GTLR_LOG_PERFORMANCE
    NSTimeInterval secs1, secs2;
    secs1 = [NSDate timeIntervalSinceReferenceDate];
#endif
    id<GTLRObjectClassResolver> objectClassResolver = ticket.objectClassResolver;

    if ((downloadAsDataObjectType.length != 0) && fetchError == nil) {
      GTLRDataObject *dataObject = [GTLRDataObject object];
      dataObject.data = data;
      dataObject.contentType = contentType;
      parsedObject = dataObject;
    } else if (isJSON) {
      NSError *parseError = nil;
      NSMutableDictionary *jsonWrapper =
          [NSJSONSerialization JSONObjectWithData:data
                                          options:NSJSONReadingMutableContainers
                                            error:&parseError];
      if (jsonWrapper == nil) {
        fetchError = parseError;
      } else {
        NSMutableDictionary *json;

        if (_dataWrapperRequired) {
          json = [jsonWrapper valueForKey:@"data"];
        } else {
          json = jsonWrapper;
        }

        if (json != nil) {
          parsedObject = [GTLRObject objectForJSON:json
                                      defaultClass:defaultClass
                               objectClassResolver:objectClassResolver];
        }
      }
    } else {
      // Has non-JSON data; it may be batch data.
      NSString *boundary;
      BOOL isBatchResponse = [self isContentTypeMultipart:contentType
                                                 boundary:&boundary];
      if (isBatchResponse) {
        NSArray *mimeParts = [GTMMIMEDocument MIMEPartsWithBoundary:boundary
                                                               data:data];
        NSArray *responseParts = [self responsePartsWithMIMEParts:mimeParts];
        GTLRBatchResult *batchResult = [self batchResultWithResponseParts:responseParts
                                                            batchClassMap:batchClassMap
                                                      objectClassResolver:objectClassResolver];
        parsedObject = batchResult;
      } else {
        GTLR_DEBUG_ASSERT(0, @"Got unexpected content type '%@'", contentType);
      }
    }  // isJSON

#if GTLR_LOG_PERFORMANCE
    secs2 = [NSDate timeIntervalSinceReferenceDate];
    NSLog(@"allocation of %@ took %f seconds", objectClass, secs2 - secs1);
#endif
  }

  [self handleParsedObjectForFetcher:fetcher
                      executingQuery:executingQuery
                              ticket:ticket
                               error:fetchError
                        parsedObject:parsedObject
     hasSentParsingStartNotification:hasSentParsingStartNotification
                   completionHandler:completionHandler];
}

- (void)handleParsedObjectForFetcher:(GTMSessionFetcher *)fetcher
                      executingQuery:(id<GTLRQueryProtocol>)executingQuery
                              ticket:(GTLRServiceTicket *)ticket
                               error:(NSError *)error
                        parsedObject:(GTLRObject *)object
     hasSentParsingStartNotification:(BOOL)hasSentParsingStartNotification
                   completionHandler:(GTLRServiceCompletionHandler)completionHandler {
  GTLR_ASSERT_CURRENT_QUEUE_DEBUG(self.parseQueue);

  BOOL isResourceURLQuery = [executingQuery isKindOfClass:[GTLRResourceURLQuery class]];

  // There may not be an object due to a fetch or parsing error
  BOOL shouldFetchNextPages = ticket.shouldFetchNextPages && !isResourceURLQuery;
  GTLRObject *previousObject = ticket.fetchedObject;
  BOOL isFirstPage = (previousObject == nil);

  if (shouldFetchNextPages && !isFirstPage && (object != nil)) {
    // Accumulate new results
    object = [self mergedNewResultObject:object
                         oldResultObject:previousObject
                                forQuery:executingQuery
                                  ticket:ticket];
  }

  ticket.fetchedObject = object;
  ticket.fetchError = error;

  if (hasSentParsingStartNotification) {
    // we want to always balance the start and stop notifications
    [ticket postNotificationOnMainThreadWithName:kGTLRServiceTicketParsingStoppedNotification
                                          object:ticket
                                        userInfo:nil];
  }

  BOOL shouldCallCallbacks = YES;

  if (error == nil) {
    ++ticket.pagesFetchedCounter;

    // Use the nextPageToken to fetch any later pages for non-batch queries
    //
    // This assumes a pagination model where objects have entries in a known "items"
    // field and a "nextPageToken" field, and queries support a "pageToken"
    // parameter.

    if (shouldFetchNextPages) {
      // Determine if we should fetch more pages of results

      GTLRQuery *nextPageQuery =
        (GTLRQuery *)[self nextPageQueryForQuery:executingQuery
                                          result:object
                                          ticket:ticket];
      if (nextPageQuery) {
        BOOL isFetchingMore = [self fetchNextPageWithQuery:nextPageQuery
                                         completionHandler:completionHandler
                                                    ticket:ticket];
        if (isFetchingMore) {
          shouldCallCallbacks = NO;
        }
      } else {
        // nextPageQuery == nil; no more page tokens are present
  #if DEBUG && !GTLR_SKIP_PAGES_WARNING
        // Each next page followed to accumulate all pages of a feed takes up to
        // a few seconds.  When multiple pages are being fetched, that
        // usually indicates that a larger page size (that is, more items per
        // feed fetched) should be requested.
        //
        // To avoid fetching many pages, set query.maxResults so the feed
        // requested is large enough to rarely need to follow next links.
        NSUInteger pageCount = ticket.pagesFetchedCounter;
        if (pageCount > 2) {
          NSString *queryLabel;
          if ([executingQuery isBatchQuery]) {
            queryLabel = @"batch query";
          } else {
            queryLabel = [[executingQuery class] description];
          }
          GTLR_DEBUG_LOG(@"Executing %@ query required fetching %lu pages; use a query with"
                         @" a larger maxResults for faster results",
                         queryLabel, (unsigned long)pageCount);
        }
  #endif
      }  // nextPageQuery
    } else {
      // !ticket.shouldFetchNextPages
  #if DEBUG && !GTLR_SKIP_PAGES_WARNING
      // Let the developer know that there were additional pages that would have been
      // fetched if shouldFetchNextPages was enabled.
      //
      // The client may specify a larger page size with the query's maxResults property,
      // or enable automatic pagination by turning on shouldFetchNextPages on the service
      // or on the query's executionParameters.
      if ([executingQuery respondsToSelector:@selector(pageToken)]
          && [object isKindOfClass:[GTLRCollectionObject class]]
          && [object respondsToSelector:@selector(nextPageToken)]
          && object.nextPageToken.length > 0) {
        GTLR_DEBUG_LOG(@"Executing %@ has additional pages of results not fetched because"
                       @" shouldFetchNextPages is not enabled", [executingQuery class]);
      }
  #endif
    }  // ticket.shouldFetchNextPages
  }  // error == nil

  if (!isFirstPage) {
    // Release callbacks from this completed page's query.
    [executingQuery invalidateQuery];
  }

  // We no longer care about the queries for page 2 or later, so for the client
  // inspecting the ticket in the callback, the executing query should be
  // the original one
  ticket.executingQuery = ticket.originalQuery;

  if (!shouldCallCallbacks) {
    // More fetches are happening.
  } else {
    dispatch_group_async(ticket.callbackGroup, ticket.callbackQueue, ^{
      // First, call query-specific callback blocks.  We do this before the
      // fetch callback to let applications do any final clean-up (or update
      // their UI) in the fetch callback.
      GTLRQuery *originalQuery = (GTLRQuery *)ticket.originalQuery;

      if (!ticket.cancelled) {
        if (![originalQuery isBatchQuery]) {
          // Single query
          GTLRServiceCompletionHandler completionBlock = originalQuery.completionBlock;
          if (completionBlock) {
            completionBlock(ticket, object, error);
          }
        } else {
          [self invokeBatchCompletionsWithTicket:ticket
                                      batchQuery:(GTLRBatchQuery *)originalQuery
                                     batchResult:(GTLRBatchResult *)object
                                           error:error];
        }

        if (completionHandler) {
          completionHandler(ticket, object, error);
        }
        ticket.hasCalledCallback = YES;
      }  // !ticket.cancelled

      [ticket releaseTicketCallbacks];
      [ticket endBackgroundTask];

      // Even if the ticket has been cancelled, it should notify that it's stopped.
      [ticket notifyStarting:NO];

      // Release query callback blocks.
      [originalQuery invalidateQuery];
    });
  }
}

- (BOOL)isContentTypeMultipart:(NSString *)contentType
                      boundary:(NSString **)outBoundary {
  NSScanner *scanner = [NSScanner scannerWithString:contentType];
  // By default, the scanner skips leading whitespace.
  if ([scanner scanString:@"multipart/mixed; boundary=" intoString:NULL]
      && [scanner scanUpToCharactersFromSet:[NSCharacterSet newlineCharacterSet]
                                 intoString:outBoundary]) {
        return YES;
      }
  return NO;
}

- (NSArray <GTLRBatchResponsePart *>*)responsePartsWithMIMEParts:(NSArray <GTMMIMEDocumentPart *>*)mimeParts {
  NSMutableArray *resultParts = [NSMutableArray arrayWithCapacity:mimeParts.count];

  for (GTMMIMEDocumentPart *mimePart in mimeParts) {
    GTLRBatchResponsePart *responsePart = [self responsePartWithMIMEPart:mimePart];
    [resultParts addObject:responsePart];
  }
  return resultParts;
}

- (GTLRBatchResponsePart *)responsePartWithMIMEPart:(GTMMIMEDocumentPart *)mimePart {
  // The MIME part body looks like
  //
  // Headers (from the MIME part):
  //   Content-Type: application/http
  //   Content-ID: response-gtlr_5
  //
  // Body (including inner headers):
  //   HTTP/1.1 200 OK
  //   Content-Type: application/json; charset=UTF-8
  //   Date: Sat, 16 Jan 2016 18:57:05 GMT
  //   Expires: Sat, 16 Jan 2016 18:57:05 GMT
  //   Cache-Control: private, max-age=0
  //   Content-Length: 13459
  //
  //   {"kind":"drive#fileList", ...}

  GTLRBatchResponsePart *responsePart = [[GTLRBatchResponsePart alloc] init];

  // The only header in the actual (outer) MIME multipart headers we want is Content-ID.
  //
  // The content ID in the response looks like
  //
  //   Content-ID: response-gtlr_5
  //
  // but we will strip the "response-" prefix.
  NSDictionary *mimeHeaders = mimePart.headers;
  NSString *responseContentID = mimeHeaders[@"Content-ID"];
  if ([responseContentID hasPrefix:@"response-"]) {
    responseContentID = [responseContentID substringFromIndex:@"response-".length];
  }
  responsePart.contentID = responseContentID;

  // Split the body from the inner headers at the first CRLFCRLF.
  NSArray <NSNumber *>*offsets;
  NSData *mimePartBody = mimePart.body;
  [GTMMIMEDocument searchData:mimePartBody
                  targetBytes:"\r\n\r\n"
                 targetLength:4
                 foundOffsets:&offsets];
  if (offsets.count == 0) {
    // Parse error.
    NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
    [userInfo setValue:mimePartBody forKey:kGTLRServiceErrorBodyDataKey];
    [userInfo setValue:responseContentID forKey:kGTLRServiceErrorContentIDKey];
    responsePart.parseError = [NSError errorWithDomain:kGTLRServiceErrorDomain
                                                  code:GTLRServiceErrorBatchResponseUnexpected
                                              userInfo:userInfo];
  } else {
    // Separate the status/inner headers and the actual body.
    NSUInteger partBodyLength = mimePartBody.length;
    NSUInteger separatorOffset = offsets[0].unsignedIntegerValue;
    NSData *innerHeaderData =
        [mimePartBody subdataWithRange:NSMakeRange(0, (NSUInteger)separatorOffset)];

    NSData *partBodyData;
    if (separatorOffset + 4 < partBodyLength) {
      NSUInteger offsetToBodyData = separatorOffset + 4;
      NSUInteger bodyLength = mimePartBody.length - offsetToBodyData;
      partBodyData = [mimePartBody subdataWithRange:NSMakeRange(offsetToBodyData, bodyLength)];
    }

    // Parse to separate the status line and the inner headers (though we don't
    // really do much with either.)
    [GTMMIMEDocument searchData:innerHeaderData
                    targetBytes:"\r\n"
                   targetLength:2
                   foundOffsets:&offsets];
    NSData *statusLine;
    NSData *actualInnerHeaderData;
    if (offsets.count) {
      NSRange statusRange = NSMakeRange(0, offsets[0].unsignedIntegerValue);
      statusLine = [innerHeaderData subdataWithRange:statusRange];

      NSUInteger actualInnerHeaderOffset = offsets[0].unsignedIntegerValue + 2;
      if (innerHeaderData.length - actualInnerHeaderOffset > 0) {
        NSRange actualInnerHeaderRange =
            NSMakeRange(actualInnerHeaderOffset,
                        innerHeaderData.length - actualInnerHeaderOffset);
        actualInnerHeaderData = [innerHeaderData subdataWithRange:actualInnerHeaderRange];
      }
    } else {
      // There appears to only be a status line.
      //
      // This means there were no reponse headers. "Date" seems like it should
      // be required, but https://tools.ietf.org/html/rfc7231#section-7.1.1.2
      // lets even that be left off if a server doesn't have a clock it knows
      // to be correct.
      statusLine = innerHeaderData;
    }

    NSString *statusString;
    NSInteger statusCode;
    [self getResponseLineFromData:statusLine
                       statusCode:&statusCode
                     statusString:&statusString];
    responsePart.statusCode = statusCode;
    responsePart.statusString = statusString;
    responsePart.headers = [GTMMIMEDocument headersWithData:actualInnerHeaderData];

    // Create JSON from the body.
    // (if there is any, methods like delete return nothing)
    NSMutableDictionary *json;
    if (partBodyData) {
      NSError *parseError = nil;
      json = [NSJSONSerialization JSONObjectWithData:partBodyData
                                             options:NSJSONReadingMutableContainers
                                               error:&parseError];
      if (!json) {
        if (!parseError) {
          // There should be an error, but just incase...
          parseError = [NSError errorWithDomain:kGTLRServiceErrorDomain
                                           code:GTLRServiceErrorBatchResponseUnexpected
                                       userInfo:nil];
        }
        // Add our content ID and part body data to the parse error.
        NSMutableDictionary *userInfo =
            [NSMutableDictionary dictionaryWithDictionary:parseError.userInfo];
        [userInfo setValue:mimePartBody forKey:kGTLRServiceErrorBodyDataKey];
        [userInfo setValue:responseContentID forKey:kGTLRServiceErrorContentIDKey];
        responsePart.parseError = [NSError errorWithDomain:parseError.domain
                                                      code:parseError.code
                                                  userInfo:userInfo];
      }
    }
    responsePart.JSON = json;
  }
  return responsePart;
}

- (void)getResponseLineFromData:(NSData *)data
                     statusCode:(NSInteger *)outStatusCode
                   statusString:(NSString **)outStatusString {
  // Sample response line:
  //   HTTP/1.1 200 OK

  *outStatusCode = -1;
  *outStatusString = @"???";
  NSString *responseLine = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  if (!responseLine) return;

  NSScanner *scanner = [NSScanner scannerWithString:responseLine];
  // Scanner by default skips whitespace when locating the start of the next characters to
  // scan.
  NSCharacterSet *wsSet = [NSCharacterSet whitespaceAndNewlineCharacterSet];
  NSCharacterSet *newlineSet = [NSCharacterSet newlineCharacterSet];
  NSString *httpVersion;
  if ([scanner scanUpToCharactersFromSet:wsSet intoString:&httpVersion]
      && [scanner scanInteger:outStatusCode]
      && [scanner scanUpToCharactersFromSet:newlineSet intoString:outStatusString]) {
    // Got it all.
    #if DEBUG
      if (![httpVersion hasPrefix:@"HTTP/"]) {
        GTLR_DEBUG_LOG(@"GTLRService: Non-standard HTTP Version: %@", httpVersion);
      }
    #endif
  }
}

- (GTLRBatchResult *)batchResultWithResponseParts:(NSArray <GTLRBatchResponsePart *>*)parts
                                    batchClassMap:(NSDictionary *)batchClassMap
                              objectClassResolver:(id<GTLRObjectClassResolver>)objectClassResolver {
  // Allow the resolver to override the batch rules class also.
  Class resultClass =
      GTLRObjectResolveClass(objectClassResolver,
                             [NSDictionary dictionary],
                             [GTLRBatchResult class]);
  GTLRBatchResult *batchResult = [resultClass object];

  NSMutableDictionary *successes = [NSMutableDictionary dictionary];
  NSMutableDictionary *failures = [NSMutableDictionary dictionary];
  NSMutableDictionary *responseHeaders = [NSMutableDictionary dictionary];

  for (GTLRBatchResponsePart *responsePart in parts) {
    NSString *contentID = responsePart.contentID;
    NSDictionary *json = responsePart.JSON;
    NSError *parseError = responsePart.parseError;
    NSInteger statusCode = responsePart.statusCode;
    [responseHeaders setValue:responsePart.headers forKey:contentID];

    if (parseError) {
      GTLRErrorObject *parseErrorObject = [GTLRErrorObject objectWithFoundationError:parseError];
      [failures setValue:parseErrorObject forKey:contentID];
    } else {
      // There is JSON.
      NSMutableDictionary *errorJSON = [json objectForKey:@"error"];
      if (errorJSON) {
        // A JSON error body should be the most informative error.
        GTLRErrorObject *errorObject = [GTLRErrorObject objectWithJSON:errorJSON];
        [failures setValue:errorObject forKey:contentID];
      } else if (statusCode < 200 || statusCode > 399) {
        // Report a fetch failure for this part that lacks a JSON error.
        NSString *errorStr = responsePart.statusString;
        NSDictionary *userInfo = @{
          NSLocalizedDescriptionKey : (errorStr ?: @"<unknown>"),
        };
        NSError *httpError = [NSError errorWithDomain:kGTLRServiceErrorDomain
                                                 code:GTLRServiceErrorBatchResponseStatusCode
                                             userInfo:userInfo];
        GTLRErrorObject *httpErrorObject = [GTLRErrorObject objectWithFoundationError:httpError];
        [failures setValue:httpErrorObject forKey:contentID];
      } else {
        // The JSON represents a successful response.
        Class defaultClass = batchClassMap[contentID];
        id resultObject = [GTLRObject objectForJSON:[json mutableCopy]
                                       defaultClass:defaultClass
                                objectClassResolver:objectClassResolver];
        if (resultObject == nil) {
          // Methods like delete return no object.
          resultObject = [NSNull null];
        }
        [successes setValue:resultObject forKey:contentID];
      }  // errorJSON
    }  // parseError
  }  // for
  batchResult.successes = successes;
  batchResult.failures = failures;
  batchResult.responseHeaders = responseHeaders;
  return batchResult;
}

- (void)invokeBatchCompletionsWithTicket:(GTLRServiceTicket *)ticket
                              batchQuery:(GTLRBatchQuery *)batchQuery
                             batchResult:(GTLRBatchResult *)batchResult
                                   error:(NSError *)error {
  // Batch query
  //
  // We'll step through the queries of the original batch, not of the
  // batch result
  GTLR_ASSERT_CURRENT_QUEUE_DEBUG(ticket.callbackQueue);

  NSDictionary *successes = batchResult.successes;
  NSDictionary *failures = batchResult.failures;

  for (GTLRQuery *oneQuery in batchQuery.queries) {
    GTLRServiceCompletionHandler completionBlock = oneQuery.completionBlock;
    if (completionBlock) {
      // If there was no networking error, look for a query-specific
      // error or result
      GTLRObject *oneResult = nil;
      NSError *oneError = error;
      if (oneError == nil) {
        NSString *requestID = [oneQuery requestID];
        GTLRErrorObject *gtlrError = [failures objectForKey:requestID];
        if (gtlrError) {
          oneError = [gtlrError foundationError];
        } else {
          oneResult = [successes objectForKey:requestID];
          if (oneResult == nil) {
            // We found neither a success nor a failure for this query, unexpectedly.
            GTLR_DEBUG_LOG(@"GTLRService: Batch result missing for request %@",
                           requestID);
            oneError = [NSError errorWithDomain:kGTLRServiceErrorDomain
                                           code:GTLRServiceErrorQueryResultMissing
                                       userInfo:nil];
          }
        }
      }
      completionBlock(ticket, oneResult, oneError);
    }
  }
}

- (void)simulateFetchWithTicket:(GTLRServiceTicket *)ticket
                      testBlock:(GTLRServiceTestBlock)testBlock
                     dataToPost:(NSData *)dataToPost
              completionHandler:(GTLRServiceCompletionHandler)completionHandler {

  GTLRQuery *originalQuery = (GTLRQuery *)ticket.originalQuery;
  ticket.executingQuery = originalQuery;

  testBlock(ticket, ^(id testObject, NSError *testError) {
    dispatch_group_async(ticket.callbackGroup, ticket.callbackQueue, ^{
      if (!ticket.cancelled) {
        if (testError) {
          // During simulation, we invoke any retry block, but ignore the result.
          const BOOL willRetry = NO;
          GTLRServiceRetryBlock retryBlock = ticket.retryBlock;
          if (retryBlock) {
            (void)retryBlock(ticket, willRetry, testError);
          }
        } else {
          // Simulate upload progress, calling back up to three times.
          if (ticket.uploadProgressBlock) {
            GTLRQuery *query = (GTLRQuery *)ticket.originalQuery;
            unsigned long long uploadLength = [self simulatedUploadLengthForQuery:query
                                                                       dataToPost:dataToPost];
            unsigned long long sendReportSize = uploadLength / 3 + 1;
            unsigned long long totalSentSoFar = 0;
            while (totalSentSoFar < uploadLength) {
              unsigned long long bytesRemaining = uploadLength - totalSentSoFar;
              sendReportSize = MIN(sendReportSize, bytesRemaining);
              totalSentSoFar += sendReportSize;

              [self invokeProgressCallbackForTicket:ticket
                                     deliveredBytes:(unsigned long long)totalSentSoFar
                                         totalBytes:(unsigned long long)uploadLength];
            }
            [ticket postNotificationOnMainThreadWithName:kGTLRServiceTicketParsingStartedNotification
                                                  object:ticket
                                                userInfo:nil];
            [ticket postNotificationOnMainThreadWithName:kGTLRServiceTicketParsingStoppedNotification
                                                  object:ticket
                                                userInfo:nil];
          }
        }

        if (![originalQuery isBatchQuery]) {
          // Single query
          GTLRServiceCompletionHandler completionBlock = originalQuery.completionBlock;
          if (completionBlock) {
            completionBlock(ticket, testObject, testError);
          }
        } else {
          // Batch query
          GTLR_DEBUG_ASSERT(!testObject || [testObject isKindOfClass:[GTLRBatchResult class]],
              @"Batch queries should have result objects of type GTLRBatchResult (not %@)",
              [testObject class]);

          [self invokeBatchCompletionsWithTicket:ticket
                                      batchQuery:(GTLRBatchQuery *)originalQuery
                                     batchResult:(GTLRBatchResult *)testObject
                                           error:testError];
        } // isBatchQuery

        if (completionHandler) {
          completionHandler(ticket, testObject, testError);
        }
        ticket.hasCalledCallback = YES;
      }  // !ticket.cancelled

      // Even if the ticket has been cancelled, it should notify that it's stopped.
      [ticket notifyStarting:NO];

      // Release query callback blocks.
      [originalQuery invalidateQuery];
    });  // dispatch_group_async
  });  // testBlock
}

- (unsigned long long)simulatedUploadLengthForQuery:(GTLRQuery *)query
                                         dataToPost:(NSData *)dataToPost {
  // We're uploading the body object and other posted metadata, plus optionally the
  // data or file specified in the upload parameters.
  unsigned long long uploadLength = dataToPost.length;

  GTLRUploadParameters *uploadParameters = query.uploadParameters;
  if (uploadParameters) {
    NSData *uploadData = uploadParameters.data;
    if (uploadData) {
      uploadLength += uploadData.length;
    } else {
      NSURL *fileURL = uploadParameters.fileURL;
      if (fileURL) {
        NSError *fileError = nil;
        NSNumber *fileSizeNum = nil;
        if ([fileURL getResourceValue:&fileSizeNum
                               forKey:NSURLFileSizeKey
                                error:&fileError]) {
          uploadLength += fileSizeNum.unsignedLongLongValue;
        }
      } else {
        NSFileHandle *fileHandle = uploadParameters.fileHandle;
        unsigned long long fileLength = [fileHandle seekToEndOfFile];
        uploadLength += fileLength;
      }
    }
  }
  return uploadLength;
}

#pragma mark -

// Given a single or batch query and its result, make a new query
// for the next pages, if any.  Returns nil if there's no additional
// query to make.
//
// This method calls itself recursively to make the individual next page
// queries for a batch query.
- (id <GTLRQueryProtocol>)nextPageQueryForQuery:(id<GTLRQueryProtocol>)query
                                         result:(GTLRObject *)object
                                         ticket:(GTLRServiceTicket *)ticket {
  if (![query isBatchQuery]) {
    // This is a single query
    GTLRQuery *currentPageQuery = (GTLRQuery *)query;

    // Determine if we should fetch more pages of results
    GTLRQuery *nextPageQuery = nil;
    NSString *nextPageToken = nil;

    if ([object respondsToSelector:@selector(nextPageToken)]
        && [currentPageQuery respondsToSelector:@selector(pageToken)]) {
      nextPageToken = [object performSelector:@selector(nextPageToken)];
    }

    if (nextPageToken && [object isKindOfClass:[GTLRCollectionObject class]]) {
      NSString *itemsKey = [[object class] collectionItemsKey];
      GTLR_DEBUG_ASSERT(itemsKey != nil, @"Missing accumulation items key for %@", [object class]);

      SEL itemsSel = NSSelectorFromString(itemsKey);
      if ([object respondsToSelector:itemsSel]) {
        // Make a query for the next page, preserving the request ID
        nextPageQuery = [currentPageQuery copy];
        nextPageQuery.requestID = currentPageQuery.requestID;

        [nextPageQuery performSelector:@selector(setPageToken:)
                            withObject:nextPageToken];
      } else {
        GTLR_DEBUG_ASSERT(0, @"%@ does not implement its collection items property \"%@\"",
                          [object class], itemsKey);
      }
    }
    return nextPageQuery;
  } else {
    // This is a batch query
    //
    // Check if there's a next page to fetch for any of the success
    // results by invoking this method recursively on each of those results
    GTLRBatchResult *batchResult = (GTLRBatchResult *)object;
    GTLRBatchQuery *nextPageBatchQuery = nil;
    NSDictionary *successes = batchResult.successes;

    for (NSString *requestID in successes) {
      GTLRObject *singleObject = [successes objectForKey:requestID];
      GTLRQuery *singleQuery = [ticket queryForRequestID:requestID];

      GTLRQuery *newQuery =
        (GTLRQuery *)[self nextPageQueryForQuery:singleQuery
                                          result:singleObject
                                          ticket:ticket];
      if (newQuery) {
        // There is another query to fetch
        if (nextPageBatchQuery == nil) {
          nextPageBatchQuery = [GTLRBatchQuery batchQuery];
        }
        [nextPageBatchQuery addQuery:newQuery];
      }
    }
    return nextPageBatchQuery;
  }
}

// When a ticket is set to fetch more pages for feeds, this routine
// initiates the fetch for each additional feed page
//
// Returns YES if fetching of the next page has started.
- (BOOL)fetchNextPageWithQuery:(GTLRQuery *)query
             completionHandler:(GTLRServiceCompletionHandler)handler
                        ticket:(GTLRServiceTicket *)ticket {
  // Sanity check the number of pages fetched already
  if (ticket.pagesFetchedCounter > kMaxNumberOfNextPagesFetched) {
    // Sanity check failed: way too many pages were fetched, so the query's
    // page size should be bigger to avoid driving up networking and server
    // overhead.
    //
    // The client should be querying with a higher max results per page
    // to avoid this.
    GTLR_DEBUG_ASSERT(0, @"Fetched too many next pages executing %@;"
                         @" increase maxResults page size to avoid this.",
                      [query class]);
    return NO;
  }

  GTLRServiceTicket *newTicket;
  if ([query isBatchQuery]) {
    newTicket = [self executeBatchQuery:(GTLRBatchQuery *)query
                      completionHandler:handler
                                 ticket:ticket];
  } else {
    BOOL mayAuthorize = !query.shouldSkipAuthorization;
    NSURL *url = [self URLFromQueryObject:query
                          usePartialPaths:NO
             includeServiceURLQueryParams:YES];
    newTicket = [self fetchObjectWithURL:url
                             objectClass:query.expectedObjectClass
                              bodyObject:query.bodyObject
                                    ETag:nil
                              httpMethod:query.httpMethod
                            mayAuthorize:mayAuthorize
                       completionHandler:handler
                          executingQuery:query
                                  ticket:ticket];
  }

  // In the bizarre case that the fetch didn't begin, newTicket will be
  // nil.  So long as the new ticket is the same as the ticket we're
  // continuing, then we're happy.
  GTLR_ASSERT(newTicket == ticket || newTicket == nil,
              @"Pagination should not create an additional ticket: %@", newTicket);

  BOOL isFetchingNextPageWithCurrentTicket = (newTicket == ticket);
  return isFetchingNextPageWithCurrentTicket;
}

// Given a new single or batch result (meaning additional pages for a previous
// query result), merge it into the old result, and return the updated object.
//
// For a single result, this inserts the old result items into the new result.
// For batch results, this replaces some of the old items with new items.
//
// This method changes the objects passed in (the old result for batches, the new result
// for individual objects.)
- (GTLRObject *)mergedNewResultObject:(GTLRObject *)newResult
                      oldResultObject:(GTLRObject *)oldResult
                             forQuery:(id<GTLRQueryProtocol>)query
                               ticket:(GTLRServiceTicket *)ticket {
  GTLR_DEBUG_ASSERT([oldResult isMemberOfClass:[newResult class]],
                    @"Trying to merge %@ and %@", [oldResult class], [newResult class]);

  if ([query isBatchQuery]) {
    // Batch query result
    //
    // The new batch results are a subset of the old result's queries, since
    // not all queries in the batch necessarily have additional pages.
    //
    // New success objects replace old success objects, with the old items
    // prepended; new failure objects replace old success objects.
    // We will update the old batch results with accumulated items, using the
    // new objects, and return the old batch.
    //
    // We reuse the old batch results object because it may include some earlier
    // results which did not have additional pages.
    GTLRBatchResult *newBatchResult = (GTLRBatchResult *)newResult;
    GTLRBatchResult *oldBatchResult = (GTLRBatchResult *)oldResult;

    NSDictionary *newSuccesses = newBatchResult.successes;
    if (newSuccesses.count > 0) {
      NSDictionary *oldSuccesses = oldBatchResult.successes;
      NSMutableDictionary *mutableOldSuccesses = [oldSuccesses mutableCopy];

      for (NSString *requestID in newSuccesses) {
        GTLRObject *newObj = [newSuccesses objectForKey:requestID];
        GTLRObject *oldObj = [oldSuccesses objectForKey:requestID];

        GTLRQuery *thisQuery = [ticket queryForRequestID:requestID];

        // Recursively merge the single query's result object, appending new items to the old items.
        GTLRObject *updatedObj = [self mergedNewResultObject:newObj
                                             oldResultObject:oldObj
                                                    forQuery:thisQuery
                                                      ticket:ticket];

        // In the old batch, replace the old result object with the new one.
        [mutableOldSuccesses setObject:updatedObj forKey:requestID];
      }  // for requestID
      oldBatchResult.successes = mutableOldSuccesses;
    }  // newSuccesses.count > 0

    NSDictionary *newFailures = newBatchResult.failures;
    if (newFailures.count > 0) {
      NSMutableDictionary *mutableOldSuccesses = [oldBatchResult.successes mutableCopy];
      NSMutableDictionary *mutableOldFailures = [oldBatchResult.failures mutableCopy];
      for (NSString *requestID in newFailures) {
        // In the old batch, replace old successes or failures with the new failure.
        GTLRErrorObject *newError = [newFailures objectForKey:requestID];
        [mutableOldFailures setObject:newError forKey:requestID];

        [mutableOldSuccesses removeObjectForKey:requestID];
      }
      oldBatchResult.failures = mutableOldFailures;
      oldBatchResult.successes = mutableOldSuccesses;
    }  // newFailures.count > 0
    return oldBatchResult;
  } else {
    // Single query result
    //
    // Merge the items into the new object, and return the new object.
    NSString *itemsKey = [[oldResult class] collectionItemsKey];

    GTLR_DEBUG_ASSERT([oldResult respondsToSelector:NSSelectorFromString(itemsKey)],
                      @"Collection items key \"%@\" not implemented by %@", itemsKey, oldResult);
    if (itemsKey) {
      // Append the new items to the old items.
      NSArray *oldItems = [oldResult valueForKey:itemsKey];
      NSArray *newItems = [newResult valueForKey:itemsKey];
      NSMutableArray *items = [NSMutableArray arrayWithArray:oldItems];
      [items addObjectsFromArray:newItems];
      [newResult setValue:items forKey:itemsKey];
    } else {
      // This shouldn't happen.
      newResult = oldResult;
    }
    return newResult;
  }
}

#pragma mark -

// GTLRQuery methods.

// Helper to create the URL from the parts.
- (NSURL *)URLFromQueryObject:(GTLRQuery *)query
              usePartialPaths:(BOOL)usePartialPaths
 includeServiceURLQueryParams:(BOOL)includeServiceURLQueryParams {
  NSString *rootURLString = self.rootURLString;

  // Skip URI template expansion if the resource URL was provided.
  if ([query isKindOfClass:[GTLRResourceURLQuery class]]) {
    // Because the query is created by the service rather than by the user,
    // query.additionalURLQueryParameters must be nil, and usePartialPaths
    // is irrelevant as the query is not in a batch.
    GTLR_DEBUG_ASSERT(!usePartialPaths,
                      @"Batch not supported with resource URL fetch");
    GTLR_DEBUG_ASSERT(!query.uploadParameters && !query.useMediaDownloadService
                      && !query.downloadAsDataObjectType && !query.additionalURLQueryParameters,
                      @"Unsupported query properties");
    NSURL *result = ((GTLRResourceURLQuery *)query).resourceURL;
    if (includeServiceURLQueryParams) {
      NSDictionary *additionalParams = self.additionalURLQueryParameters;
      if (additionalParams.count) {
        result = [GTLRService URLWithString:result.absoluteString
                                       queryParameters:additionalParams];
      }
    }
    return result;
  }

  // This is all the dance needed due to having query and path parameters for
  // REST based queries.
  NSDictionary *params = query.JSON;
  NSString *queryFilledPathURI = [GTLRURITemplate expandTemplate:query.pathURITemplate
                                                          values:params];

  // Per https://developers.google.com/discovery/v1/using#build-compose and
  // https://developers.google.com/discovery/v1/using#discovery-doc-methods-mediadownload
  // glue together the parts.
  NSString *servicePath = self.servicePath ?: @"";
  NSString *uploadPath = @"";
  NSString *downloadPath = @"";

  GTLR_DEBUG_ASSERT([rootURLString hasSuffix:@"/"],
                    @"rootURLString should end in a slash: %@", rootURLString);
  GTLR_DEBUG_ASSERT(((servicePath.length == 0) ||
                     (![servicePath hasPrefix:@"/"] && [servicePath hasSuffix:@"/"])),
                    @"servicePath shouldn't start with a slash but should end with one: %@",
                    servicePath);
  GTLR_DEBUG_ASSERT(![query.pathURITemplate hasPrefix:@"/"],
                    @"the queries's pathURITemplate should not start with a slash: %@",
                    query.pathURITemplate);

  GTLRUploadParameters *uploadParameters = query.uploadParameters;
  if (uploadParameters != nil) {
    // If there is an override, clear all the parts and just use it with the
    // the rootURLString.
    NSString *override = (uploadParameters.shouldUploadWithSingleRequest
                          ? query.simpleUploadPathURITemplateOverride
                          : query.resumableUploadPathURITemplateOverride);
    if (override.length > 0) {
      GTLR_DEBUG_ASSERT(![override hasPrefix:@"/"],
                        @"The query's %@UploadPathURITemplateOverride should not start with a slash: %@",
                        (uploadParameters.shouldUploadWithSingleRequest ? @"simple" : @"resumable"),
                        override);
      queryFilledPathURI = [GTLRURITemplate expandTemplate:override
                                                    values:params];
      servicePath = @"";
    } else {
      if (uploadParameters.shouldUploadWithSingleRequest) {
        uploadPath = self.simpleUploadPath ?: @"";
      } else {
        uploadPath = self.resumableUploadPath ?: @"";
      }
      GTLR_DEBUG_ASSERT(((uploadPath.length == 0) ||
                         (![uploadPath hasPrefix:@"/"] &&
                          [uploadPath hasSuffix:@"/"])),
                        @"%@UploadPath shouldn't start with a slash but should end with one: %@",
                        (uploadParameters.shouldUploadWithSingleRequest ? @"simple" : @"resumable"),
                        uploadPath);
    }
  }

  if (query.useMediaDownloadService &&
      (query.downloadAsDataObjectType.length > 0)) {
    downloadPath = @"download/";
    GTLR_DEBUG_ASSERT(uploadPath.length == 0,
                      @"Uploading while also downloading via mediaDownService"
                      @" is not well defined.");
  }

  if (usePartialPaths) rootURLString = @"/";

  NSString *urlString =
      [NSString stringWithFormat:@"%@%@%@%@%@",
       rootURLString, downloadPath, uploadPath, servicePath, queryFilledPathURI];

  // Remove the path parameters from the dictionary.
  NSMutableDictionary *workingQueryParams = [NSMutableDictionary dictionaryWithDictionary:params];

  NSArray *pathParameterNames = query.pathParameterNames;
  if (pathParameterNames.count > 0) {
    [workingQueryParams removeObjectsForKeys:pathParameterNames];
  }

  // Note: A developer can override the uploadType and alt query parameters via
  // query.additionalURLQueryParameters since those are added afterwards.
  if (uploadParameters.shouldUploadWithSingleRequest) {
    NSString *uploadType = uploadParameters.shouldSendUploadOnly ? @"media" : @"multipart";
    [workingQueryParams setObject:uploadType forKey:@"uploadType"];
  }
  NSString *downloadAsDataObjectType = query.downloadAsDataObjectType;
  if (downloadAsDataObjectType.length > 0) {
    [workingQueryParams setObject:downloadAsDataObjectType
                           forKey:@"alt"];
  }

  // Add any parameters the user added directly to the query.
  NSDictionary *mergedParams = MergeDictionaries(workingQueryParams,
                                                 query.additionalURLQueryParameters);
  if (includeServiceURLQueryParams) {
    // Query parameters override service parameters.
    mergedParams = MergeDictionaries(self.additionalURLQueryParameters, mergedParams);
  }

  NSURL *result = [GTLRService URLWithString:urlString
                             queryParameters:mergedParams];
  return result;
}

- (GTLRServiceTicket *)executeQuery:(id<GTLRQueryProtocol>)queryObj
                           delegate:(id)delegate
                  didFinishSelector:(SEL)finishedSelector {
  GTMSessionFetcherAssertValidSelector(delegate, finishedSelector,
                                       @encode(GTLRServiceTicket *), @encode(GTLRObject *), @encode(NSError *), 0);
  GTLRServiceCompletionHandler completionHandler = ^(GTLRServiceTicket *ticket,
                                                     id object,
                                                     NSError *error) {
    if (delegate && finishedSelector) {
      NSMethodSignature *sig = [delegate methodSignatureForSelector:finishedSelector];
      NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:sig];
      [invocation setSelector:(SEL)finishedSelector];
      [invocation setTarget:delegate];
      [invocation setArgument:&ticket atIndex:2];
      [invocation setArgument:&object atIndex:3];
      [invocation setArgument:&error atIndex:4];
      [invocation invoke];
    }
  };
  return [self executeQuery:queryObj completionHandler:completionHandler];
}

- (GTLRServiceTicket *)executeQuery:(id<GTLRQueryProtocol>)queryObj
                  completionHandler:(void (^)(GTLRServiceTicket *ticket, id object,
                                              NSError *error))handler {
  if ([queryObj isBatchQuery]) {
    GTLR_DEBUG_ASSERT([queryObj isKindOfClass:[GTLRBatchQuery class]],
                      @"GTLRBatchQuery required for batches (passed %@)",
                      [queryObj class]);
    return [self executeBatchQuery:(GTLRBatchQuery *)queryObj
                 completionHandler:handler
                            ticket:nil];
  }
  GTLR_DEBUG_ASSERT([queryObj isKindOfClass:[GTLRQuery class]],
                    @"GTLRQuery required for single queries (passed %@)",
                    [queryObj class]);

  // Copy the original query so our working query cannot be modified by the caller,
  // and release the callback blocks from the supplied query object.
  GTLRQuery *query = [(GTLRQuery *)queryObj copy];

  GTLR_DEBUG_ASSERT(!query.queryInvalid, @"Query has already been executed: %@", query);
  [queryObj invalidateQuery];

  // For individual queries, we rely on the fetcher's log formatting so pretty-printing
  // is not needed. Developers may override this in the query's additionalURLQueryParameters.
  NSArray *prettyPrintNames = self.prettyPrintQueryParameterNames;
  NSString *firstPrettyPrintName = prettyPrintNames.firstObject;
  if (firstPrettyPrintName && (query.downloadAsDataObjectType.length == 0)
      && ![query isKindOfClass:[GTLRResourceURLQuery class]]) {
    NSDictionary *queryParams = query.additionalURLQueryParameters;
    BOOL foundOne = NO;
    for (NSString *name in prettyPrintNames) {
      if ([queryParams objectForKey:name] != nil) {
        foundOne = YES;
        break;
      }
    }
    if (!foundOne) {
      NSMutableDictionary *worker =
        [NSMutableDictionary dictionaryWithDictionary:queryParams];
      [worker setObject:@"false" forKey:firstPrettyPrintName];
      query.additionalURLQueryParameters = worker;
    }
  }

  BOOL mayAuthorize = !query.shouldSkipAuthorization;
  NSURL *url = [self URLFromQueryObject:query
                        usePartialPaths:NO
           includeServiceURLQueryParams:YES];

  return [self fetchObjectWithURL:url
                      objectClass:query.expectedObjectClass
                       bodyObject:query.bodyObject
                             ETag:nil
                       httpMethod:query.httpMethod
                     mayAuthorize:mayAuthorize
                completionHandler:handler
                   executingQuery:query
                           ticket:nil];
}

- (GTLRServiceTicket *)fetchObjectWithURL:(NSURL *)resourceURL
                              objectClass:(nullable Class)objectClass
                      executionParameters:(nullable GTLRServiceExecutionParameters *)executionParameters
                        completionHandler:(nullable GTLRServiceCompletionHandler)handler {
  GTLRResourceURLQuery *query = [GTLRResourceURLQuery queryWithResourceURL:resourceURL
                                                               objectClass:objectClass];
  query.executionParameters = executionParameters;

  return [self executeQuery:query
          completionHandler:handler];
}

#pragma mark -

- (NSString *)userAgent {
  return _userAgent;
}

- (void)setExactUserAgent:(NSString *)userAgent {
  _userAgent = [userAgent copy];
}

- (void)setUserAgent:(NSString *)userAgent {
  // remove whitespace and unfriendly characters
  NSString *str = GTMFetcherCleanedUserAgentString(userAgent);
  [self setExactUserAgent:str];
}

- (void)overrideRequestUserAgent:(nullable NSString *)requestUserAgent {
  _overrideUserAgent = [requestUserAgent copy];
}

#pragma mark -

+ (NSDictionary<NSString *, Class> *)kindStringToClassMap {
  // Generated services will provide custom ones.
  return [NSDictionary dictionary];
}

#pragma mark -

// The service properties becomes the initial value for each future ticket's
// properties
- (void)setServiceProperties:(NSDictionary *)dict {
  _serviceProperties = [dict copy];
}

- (NSDictionary *)serviceProperties {
  // be sure the returned pointer has the life of the autorelease pool,
  // in case self is released immediately
  __autoreleasing id props = _serviceProperties;
  return props;
}

- (void)setAuthorizer:(id <GTMFetcherAuthorizationProtocol>)authorizer {
  self.fetcherService.authorizer = authorizer;
}

- (id <GTMFetcherAuthorizationProtocol>)authorizer {
  return self.fetcherService.authorizer;
}

+ (NSUInteger)defaultServiceUploadChunkSize {
  // Subclasses may override this method.

  // The upload server prefers multiples of 256K.
  const NSUInteger kMegabyte = 4 * 256 * 1024;

#if TARGET_OS_IPHONE
  // For iOS, we're balancing a large upload size with limiting the memory
  // used for the upload data buffer.
  return 4 * kMegabyte;
#else
  // A large upload chunk size minimizes http overhead and server effort.
  return 25 * kMegabyte;
#endif
}

- (NSUInteger)serviceUploadChunkSize {
  if (_uploadChunkSize > 0) {
    return _uploadChunkSize;
  }
  return [[self class] defaultServiceUploadChunkSize];
}

- (void)setServiceUploadChunkSize:(NSUInteger)val {
  _uploadChunkSize = val;
}

- (void)setSurrogates:(NSDictionary <Class, Class>*)surrogates {
  NSDictionary *kindMap = [[self class] kindStringToClassMap];

  self.objectClassResolver = [GTLRObjectClassResolver resolverWithKindMap:kindMap
                                                               surrogates:surrogates];
}

#pragma mark - Internal helper

// If there are already query parameters on urlString, the new ones are simply
// appended after them.
+ (NSURL *)URLWithString:(NSString *)urlString
         queryParameters:(NSDictionary *)queryParameters {
  if (urlString.length == 0) return nil;

  NSString *fullURLString;
  if (queryParameters.count > 0) {
    // Use GTLRURITemplate by building up a template and then feeding in the
    // values. The template is query expansion ('?'), and any key that is
    // an array or dictionary gets tagged to explode them ('+').
    NSArray *sortedQueryParamKeys =
      [queryParameters.allKeys sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)];

    NSMutableString *template = [@"{" mutableCopy];
    char joiner = '?';
    for (NSString *key in sortedQueryParamKeys) {
      [template appendFormat:@"%c%@", joiner, key];
      id value = [queryParameters objectForKey:key];
      if ([value isKindOfClass:[NSArray class]] ||
          [value isKindOfClass:[NSDictionary class]]) {
        [template appendString:@"+"];
      }
      joiner = ',';
    }
    [template appendString:@"}"];
    NSString *urlArgs =
        [GTLRURITemplate expandTemplate:template
                                 values:queryParameters];
    urlArgs = [urlArgs substringFromIndex:1];  // Drop the '?' and use the joiner.

    BOOL missingQMark = ([urlString rangeOfString:@"?"].location == NSNotFound);
    joiner = missingQMark ? '?' : '&';
    fullURLString =
      [NSString stringWithFormat:@"%@%c%@", urlString, joiner, urlArgs];
  } else {
    fullURLString = urlString;
  }
  NSURL *result = [NSURL URLWithString:fullURLString];
  return result;
}

@end

@implementation GTLRService (TestingSupport)

+ (instancetype)mockServiceWithFakedObject:(id)objectOrNil
                                fakedError:(NSError *)errorOrNil {
  GTLRService *service = [[GTLRService alloc] init];
  service.rootURLString = @"https://example.invalid/";
  service.testBlock = ^(GTLRServiceTicket *ticket, GTLRServiceTestResponse testResponse) {
    testResponse(objectOrNil, errorOrNil);
  };
  return service;
}

- (BOOL)waitForTicket:(GTLRServiceTicket *)ticket
              timeout:(NSTimeInterval)timeoutInSeconds {
  // Loop until the fetch completes or is cancelled, or until the timeout has expired.
  NSDate *giveUpDate = [NSDate dateWithTimeIntervalSinceNow:timeoutInSeconds];

  BOOL hasTimedOut = NO;
  while (1) {
    int64_t delta = (int64_t)(100 * NSEC_PER_MSEC);  // 100 ms
    BOOL areCallbacksPending =
      (dispatch_group_wait(ticket.callbackGroup, dispatch_time(DISPATCH_TIME_NOW, delta)) != 0);

    if (!areCallbacksPending && (ticket.hasCalledCallback || ticket.cancelled)) break;

    hasTimedOut = (giveUpDate.timeIntervalSinceNow <= 0);
    if (hasTimedOut) {
      if (areCallbacksPending) {
        // A timeout while waiting for the dispatch group to finish is seriously unexpected.
        GTLR_DEBUG_LOG(@"%s timed out while waiting for the dispatch group", __PRETTY_FUNCTION__);
      } else {
        GTLR_DEBUG_LOG(@"%s timed out without callbacks pending", __PRETTY_FUNCTION__);
      }
      break;
    }

    // Run the current run loop 1/1000 of a second to give the networking
    // code a chance to work.
    NSDate *stopDate = [NSDate dateWithTimeIntervalSinceNow:0.001];
    [[NSRunLoop currentRunLoop] runUntilDate:stopDate];
  }
  return !hasTimedOut;
}

@end

@implementation GTLRServiceTicket {
  GTLRService *_service;
  NSDictionary *_ticketProperties;
  GTLRServiceUploadProgressBlock _uploadProgressBlock;
  BOOL _needsStopNotification;
}

@synthesize APIKey = _apiKey,
            APIKeyRestrictionBundleID = _apiKeyRestrictionBundleID,
            allowInsecureQueries = _allowInsecureQueries,
            authorizer = _authorizer,
            cancelled = _cancelled,
            callbackGroup = _callbackGroup,
            callbackQueue = _callbackQueue,
            creationDate = _creationDate,
            executingQuery = _executingQuery,
            fetchedObject = _fetchedObject,
            fetchError = _fetchError,
            fetchRequest = _fetchRequest,
            fetcherService = _fetcherService,
            hasCalledCallback = _hasCalledCallback,
            maxRetryInterval = _maxRetryInterval,
            objectFetcher = _objectFetcher,
            originalQuery = _originalQuery,
            pagesFetchedCounter = _pagesFetchedCounter,
            postedObject = _postedObject,
            retryBlock = _retryBlock,
            retryEnabled = _retryEnabled,
            shouldFetchNextPages = _shouldFetchNextPages,
            objectClassResolver = _objectClassResolver,
            testBlock = _testBlock;

#if GTM_BACKGROUND_TASK_FETCHING
@synthesize backgroundTaskIdentifier = _backgroundTaskIdentifier;
#endif

#if DEBUG
- (instancetype)init {
  [self doesNotRecognizeSelector:_cmd];
  self = nil;
  return self;
}
#endif

#if GTM_BACKGROUND_TASK_FETCHING && DEBUG
- (void)dealloc {
  GTLR_DEBUG_ASSERT(_backgroundTaskIdentifier == UIBackgroundTaskInvalid,
                    @"Background task not ended");
}
#endif  // GTM_BACKGROUND_TASK_FETCHING && DEBUG


- (instancetype)initWithService:(GTLRService *)service
            executionParameters:(GTLRServiceExecutionParameters *)params {
  self = [super init];
  if (self) {
    // ivars set at init time and never changed are exposed as atomic readonly properties.
    _service = service;
    _fetcherService = service.fetcherService;
    _authorizer = service.authorizer;

    _ticketProperties = MergeDictionaries(service.serviceProperties, params.ticketProperties);

    _objectClassResolver = params.objectClassResolver ?: service.objectClassResolver;

    _retryEnabled = ((params.retryEnabled != nil) ? params.retryEnabled.boolValue : service.retryEnabled);
    _maxRetryInterval = ((params.maxRetryInterval != nil) ?
                         params.maxRetryInterval.doubleValue : service.maxRetryInterval);
    _shouldFetchNextPages = ((params.shouldFetchNextPages != nil)?
                             params.shouldFetchNextPages.boolValue : service.shouldFetchNextPages);

    GTLRServiceUploadProgressBlock uploadProgressBlock =
        params.uploadProgressBlock ?: service.uploadProgressBlock;
    _uploadProgressBlock = [uploadProgressBlock copy];

    GTLRServiceRetryBlock retryBlock = params.retryBlock ?: service.retryBlock;
    _retryBlock = [retryBlock copy];
    if (_retryBlock) {
      _retryEnabled = YES;
    }

    _testBlock = params.testBlock ?: service.testBlock;

    _callbackQueue = ((_Nonnull dispatch_queue_t)params.callbackQueue) ?: service.callbackQueue;
    _callbackGroup = dispatch_group_create();

    _apiKey = [service.APIKey copy];
    _apiKeyRestrictionBundleID = [service.APIKeyRestrictionBundleID copy];
    _allowInsecureQueries = service.allowInsecureQueries;

#if GTM_BACKGROUND_TASK_FETCHING
    _backgroundTaskIdentifier = UIBackgroundTaskInvalid;
#endif

    _creationDate = [NSDate date];
  }
  return self;
}

- (NSString *)description {
  NSString *devKeyInfo = @"";
  if (_apiKey != nil) {
    devKeyInfo = [NSString stringWithFormat:@" devKey:%@", _apiKey];
  }
  NSString *keyRestrictionInfo = @"";
  if (_apiKeyRestrictionBundleID != nil) {
    keyRestrictionInfo = [NSString stringWithFormat:@" restriction:%@",
                          _apiKeyRestrictionBundleID];
  }

  NSString *authorizerInfo = @"";
  id <GTMFetcherAuthorizationProtocol> authorizer = self.objectFetcher.authorizer;
  if (authorizer != nil) {
    authorizerInfo = [NSString stringWithFormat:@" authorizer:%@", authorizer];
  }

  return [NSString stringWithFormat:@"%@ %p: {service:%@%@%@%@ fetcher:%@ }",
    [self class], self,
    _service, devKeyInfo, keyRestrictionInfo, authorizerInfo, _objectFetcher];
}

- (void)postNotificationOnMainThreadWithName:(NSString *)name
                                      object:(id)object
                                    userInfo:(NSDictionary *)userInfo {
  // We always post these async to ensure they remain in order.
  dispatch_group_async(self.callbackGroup, dispatch_get_main_queue(), ^{
    [[NSNotificationCenter defaultCenter] postNotificationName:name
                                                        object:object
                                                      userInfo:userInfo];
  });
}

- (void)pauseUpload {
  GTMSessionFetcher *fetcher = self.objectFetcher;
  BOOL canPause = [fetcher respondsToSelector:@selector(pauseFetching)];
  GTLR_DEBUG_ASSERT(canPause, @"tickets can be paused only for chunked resumable uploads");

  if (canPause) {
    [(GTMSessionUploadFetcher *)fetcher pauseFetching];
  }
}

- (void)resumeUpload {
  GTMSessionFetcher *fetcher = self.objectFetcher;
  BOOL canResume = [fetcher respondsToSelector:@selector(resumeFetching)];
  GTLR_DEBUG_ASSERT(canResume, @"tickets can be resumed only for chunked resumable uploads");

  if (canResume) {
    [(GTMSessionUploadFetcher *)fetcher resumeFetching];
  }
}

- (BOOL)isUploadPaused {
  BOOL isPausable = [_objectFetcher respondsToSelector:@selector(isPaused)];
  GTLR_DEBUG_ASSERT(isPausable, @"tickets can be paused only for chunked resumable uploads");

  if (isPausable) {
    return [(GTMSessionUploadFetcher *)_objectFetcher isPaused];
  }
  return NO;
}

- (BOOL)isCancelled {
  @synchronized(self) {
    return _cancelled;
  }
}

- (void)cancelTicket {
  @synchronized(self) {
    _cancelled = YES;
  }

  [_objectFetcher stopFetching];

  self.objectFetcher = nil;
  self.fetchRequest = nil;
  _ticketProperties = nil;

  [self releaseTicketCallbacks];
  [self endBackgroundTask];

  [self.executingQuery invalidateQuery];

  id<GTLRQueryProtocol> originalQuery = self.originalQuery;
  self.executingQuery = originalQuery;
  [originalQuery invalidateQuery];

  _service = nil;
  _fetcherService = nil;
  _authorizer = nil;
  _testBlock = nil;
}

#if GTM_BACKGROUND_TASK_FETCHING
// When the fetcher's substitute UIApplication object is present, GTLRService
// will use that instead of UIApplication.  This is just to reduce duplicating
// that plumbing for testing.
+ (nullable id<GTMUIApplicationProtocol>)fetcherUIApplication {
  id<GTMUIApplicationProtocol> app = [GTMSessionFetcher substituteUIApplication];
  if (app) return app;

  static Class applicationClass = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    BOOL isAppExtension = [[[NSBundle mainBundle] bundlePath] hasSuffix:@".appex"];
    if (!isAppExtension) {
      Class cls = NSClassFromString(@"UIApplication");
      if (cls && [cls respondsToSelector:NSSelectorFromString(@"sharedApplication")]) {
        applicationClass = cls;
      }
    }
  });

  if (applicationClass) {
    app = (id<GTMUIApplicationProtocol>)[applicationClass sharedApplication];
  }
  return app;
}
#endif //  GTM_BACKGROUND_TASK_FETCHING

- (void)startBackgroundTask {
#if GTM_BACKGROUND_TASK_FETCHING
  GTLR_DEBUG_ASSERT(self.backgroundTaskIdentifier == UIBackgroundTaskInvalid,
                    @"Redundant GTLRService background task: %lu",
                    (unsigned long)self.backgroundTaskIdentifier);

  NSString *taskName = [[self.executingQuery class] description];

  id<GTMUIApplicationProtocol> app = [[self class] fetcherUIApplication];

  // We'll use a locally-scoped task ID variable so the expiration block is guaranteed
  // to refer to this task rather than to whatever task the property has.
  // Since a request can be started from any thread, we also have to ensure the
  // variable for accessing it is safe across the initial thread and the handler
  // (incase it gets failed immediately from the app already heading into the
  // background).
  __block UIBackgroundTaskIdentifier guardedTaskID = UIBackgroundTaskInvalid;
  UIBackgroundTaskIdentifier returnedTaskID =
      [app beginBackgroundTaskWithName:taskName
                     expirationHandler:^{
        // Background task expiration callback. This block is always invoked by
        // UIApplication on the main thread.
        UIBackgroundTaskIdentifier localTaskID;
        @synchronized(self) {
          localTaskID = guardedTaskID;
        }
        if (localTaskID != UIBackgroundTaskInvalid) {
          @synchronized(self) {
            if (localTaskID == self.backgroundTaskIdentifier) {
              self.backgroundTaskIdentifier = UIBackgroundTaskInvalid;
            }
          }
          // This explicitly ends the captured localTaskID rather than the backgroundTaskIdentifier
          // property to ensure expiration is handled even if the property has changed.
          [app endBackgroundTask:localTaskID];
        }
  }];
  @synchronized(self) {
    guardedTaskID = returnedTaskID;
    self.backgroundTaskIdentifier = returnedTaskID;
  }
#endif  // GTM_BACKGROUND_TASK_FETCHING
}

- (void)endBackgroundTask {
#if GTM_BACKGROUND_TASK_FETCHING
  // Whenever the connection stops or a next page is about to be fetched,
  // tell UIApplication we're done.
  UIBackgroundTaskIdentifier bgTaskID;
  @synchronized(self) {
    bgTaskID = self.backgroundTaskIdentifier;
    self.backgroundTaskIdentifier = UIBackgroundTaskInvalid;
  }
  if (bgTaskID != UIBackgroundTaskInvalid) {
    [[[self class] fetcherUIApplication] endBackgroundTask:bgTaskID];
  }
#endif  // GTM_BACKGROUND_TASK_FETCHING
}

- (void)releaseTicketCallbacks {
  self.uploadProgressBlock = nil;
  self.retryBlock = nil;
}

- (void)notifyStarting:(BOOL)isStarting {
  GTLR_DEBUG_ASSERT(!GTLR_AreBoolsEqual(isStarting, _needsStopNotification),
                    @"Notification mismatch (isStarting=%d)", isStarting);
  if (GTLR_AreBoolsEqual(isStarting, _needsStopNotification)) return;

  NSString *name;
  if (isStarting) {
    name = kGTLRServiceTicketStartedNotification;
    _needsStopNotification = YES;
  } else {
    name = kGTLRServiceTicketStoppedNotification;
    _needsStopNotification = NO;
  }
  [self postNotificationOnMainThreadWithName:name
                                      object:self
                                    userInfo:nil];
}

- (id)service {
  return _service;
}

- (void)setObjectFetcher:(GTMSessionFetcher *)fetcher {
  @synchronized(self) {
    _objectFetcher = fetcher;
  }

  [self updateObjectFetcherProgressCallbacks];
}

- (GTMSessionFetcher *)objectFetcher {
  @synchronized(self) {
    return _objectFetcher;
  }
}

- (NSDictionary *)ticketProperties {
  // be sure the returned pointer has the life of the autorelease pool,
  // in case self is released immediately
  __autoreleasing id props = _ticketProperties;
  return props;
}

- (GTLRServiceUploadProgressBlock)uploadProgressBlock {
  return _uploadProgressBlock;
}

- (void)setUploadProgressBlock:(GTLRServiceUploadProgressBlock)block {
  if (_uploadProgressBlock != block) {
    _uploadProgressBlock = [block copy];

    [self updateObjectFetcherProgressCallbacks];
  }
}

- (void)updateObjectFetcherProgressCallbacks {
  // Internal method. Do not override.
  GTMSessionFetcher *fetcher = [self objectFetcher];

  if (_uploadProgressBlock) {
    // Use a local block variable to avoid a spurious retain cycle warning.
    GTMSessionFetcherSendProgressBlock fetcherSentDataBlock = ^(int64_t bytesSent,
                                                                int64_t totalBytesSent,
                                                                int64_t totalBytesExpectedToSend) {
      [self->_service invokeProgressCallbackForTicket:self
                                       deliveredBytes:(unsigned long long)totalBytesSent
                                           totalBytes:(unsigned long long)totalBytesExpectedToSend];
    };

    fetcher.sendProgressBlock = fetcherSentDataBlock;
  } else {
    fetcher.sendProgressBlock = nil;
  }
}

- (NSInteger)statusCode {
  return [_objectFetcher statusCode];
}

- (GTLRQuery *)queryForRequestID:(NSString *)requestID {
  id<GTLRQueryProtocol> queryObj = self.executingQuery;
  if ([queryObj isBatchQuery]) {
    GTLRBatchQuery *batch = (GTLRBatchQuery *)queryObj;
    GTLRQuery *result = [batch queryForRequestID:requestID];
    return result;
  } else {
    GTLR_DEBUG_ASSERT(0, @"just use ticket.executingQuery");
    return nil;
  }
}

@end

@implementation GTLRServiceExecutionParameters

@synthesize maxRetryInterval = _maxRetryInterval,
            retryEnabled = _retryEnabled,
            retryBlock = _retryBlock,
            shouldFetchNextPages = _shouldFetchNextPages,
            objectClassResolver = _objectClassResolver,
            testBlock = _testBlock,
            ticketProperties = _ticketProperties,
            uploadProgressBlock = _uploadProgressBlock,
            callbackQueue = _callbackQueue;

- (id)copyWithZone:(NSZone *)zone {
  GTLRServiceExecutionParameters *newObject = [[self class] allocWithZone:zone];
  newObject.maxRetryInterval = self.maxRetryInterval;
  newObject.retryEnabled = self.retryEnabled;
  newObject.retryBlock = self.retryBlock;
  newObject.shouldFetchNextPages = self.shouldFetchNextPages;
  newObject.objectClassResolver = self.objectClassResolver;
  newObject.testBlock = self.testBlock;
  newObject.ticketProperties = self.ticketProperties;
  newObject.uploadProgressBlock = self.uploadProgressBlock;
  newObject.callbackQueue = self.callbackQueue;
  return newObject;
}

- (BOOL)hasParameters {
  if (self.maxRetryInterval != nil) return YES;
  if (self.retryEnabled != nil) return YES;
  if (self.retryBlock) return YES;
  if (self.shouldFetchNextPages != nil) return YES;
  if (self.objectClassResolver) return YES;
  if (self.testBlock) return YES;
  if (self.ticketProperties) return YES;
  if (self.uploadProgressBlock) return YES;
  if (self.callbackQueue) return YES;
  return NO;
}

@end


@implementation GTLRResourceURLQuery

@synthesize resourceURL = _resourceURL;

+ (instancetype)queryWithResourceURL:(NSURL *)resourceURL
                         objectClass:(Class)objectClass {
  GTLRResourceURLQuery *query = [[self alloc] initWithPathURITemplate:@"_usingGTLRResourceURLQuery_"
                                                           HTTPMethod:nil
                                                   pathParameterNames:nil];
  query.expectedObjectClass = objectClass;
  query.resourceURL = resourceURL;
  return query;
}

- (instancetype)copyWithZone:(NSZone *)zone {
  GTLRResourceURLQuery *result = [super copyWithZone:zone];
  result->_resourceURL = self->_resourceURL;
  return result;
}

// TODO: description

@end

@implementation GTLRObjectCollectionImpl
@dynamic nextPageToken;
@end
