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

// Query documentation:
// https://github.com/google/google-api-objectivec-client-for-rest/wiki#query-operations

#import "GTLRObject.h"
#import "GTLRUploadParameters.h"

NS_ASSUME_NONNULL_BEGIN

@class GTLRServiceTicket;
@class GTLRServiceExecutionParameters;
@class GTLRQuery;

/**
 * This protocol is just to support passing of either a batch or a single query
 * to a GTLRService instance. The library does not expect or support client app
 * implementations of this protocol.
 */
@protocol GTLRQueryProtocol <NSObject, NSCopying>

/**
 *  Service ticket values may be set in the execution parameters for an individual query
 *  prior to executing the query.
 */
@property(atomic, strong, null_resettable) GTLRServiceExecutionParameters *executionParameters;

- (BOOL)isBatchQuery;
- (BOOL)hasExecutionParameters;
- (BOOL)shouldSkipAuthorization;
- (void)invalidateQuery;
- (nullable NSDictionary<NSString *, NSString *> *)additionalHTTPHeaders;
- (nullable NSDictionary<NSString *, NSString *> *)additionalURLQueryParameters;
- (nullable NSString *)loggingName;
- (nullable GTLRUploadParameters *)uploadParameters;

@end

@protocol GTLRQueryCollectionProtocol
@optional
@property(nonatomic, strong) NSString *pageToken;
@end

/**
 *  A block called when a query completes executing.
 *
 *  Errors passed to the completionBlock will have an "underlying" GTLRErrorObject
 *  when the server returned an error for this specific query:
 *
 *    GTLRErrorObject *errorObj = [GTLRErrorObject underlyingObjectForError:callbackError];
 *    if (errorObj) {
 *      // The server returned this error for this specific query.
 *    } else {
 *      // The query execution fetch failed.
 *    }
 *
 *  @param callbackTicket The ticket that tracked query execution.
 *  @param object         The result of query execution. This will be derived from
 *                        GTLRObject.
 *  @param callbackError  If non-nil, the query execution failed.
 */
typedef void (^GTLRQueryCompletionBlock)(GTLRServiceTicket *callbackTicket,
                                         id _Nullable object,
                                         NSError * _Nullable callbackError);

/**
 *  Class for a single query.
 */
@interface GTLRQuery : NSObject <GTLRQueryProtocol, NSCopying>

/**
 *  The object to be uploaded with the query. The JSON of this object becomes
 *  the body for PUT and POST requests.
 */
@property(atomic, strong, nullable) GTLRObject *bodyObject;

/**
 *  Each query must have a request ID string. The client app may replace the
 *  default assigned request ID with a custom string, provided that if
 *  used in a batch query, all request IDs in the batch must be unique.
 */
@property(atomic, copy) NSString *requestID;

/**
 *  For queries which support file upload, the MIME type and file URL
 *  or data must be provided.
 */
@property(atomic, copy, nullable) GTLRUploadParameters *uploadParameters;

/**
 *  Any additional URL query parameters for this query.
 *
 *  These query parameters override the same keys from the service object's
 *  additionalURLQueryParameters
 */
@property(atomic, copy, nullable) NSDictionary<NSString *, NSString *> *additionalURLQueryParameters;

/**
 *  Any additional HTTP headers for this query.
 *
 *  These headers override the same keys from the service object's additionalHTTPHeaders
 */
@property(atomic, copy, nullable) NSDictionary<NSString *, NSString *> *additionalHTTPHeaders;

/**
 *  If set, when the query is executed, an @c "alt" query parameter is added
 *  with this value and the raw result of the query is returned in a
 *  GTLRDataObject. This is useful when the server documents result datatypes
 *  other than JSON ("csv", for example).
 */
@property(atomic, copy) NSString *downloadAsDataObjectType;

/**
 * If set, and the query also has a non-empty @c downloadAsDataObjectType, the
 * URL to download from will be modified to include "download/". This extra path
 * component avoids the need for a server redirect to the download URL.
 */
@property(atomic, assign) BOOL useMediaDownloadService;

/**
 *  Clients may set this to YES to disallow authorization. Defaults to NO.
 */
@property(atomic, assign) BOOL shouldSkipAuthorization;

/**
 *  An optional callback block to be called immediately before the executeQuery: completion handler.
 *
 *  The completionBlock property is particularly useful for queries executed in a batch.
 */
@property(atomic, copy, nullable) GTLRQueryCompletionBlock completionBlock;

/**
 *  The brief string to identify this query in GTMSessionFetcher http logs.
 *
 *  A default logging name is set by the code generator, but may be overridden by the client app.
 */
@property(atomic, copy, nullable) NSString *loggingName;

#pragma mark Internal
/////////////////////////////////////////////////////////////////////////////////////////////
//
// Properties below are used by the library and aren't typically needed by client apps.
//
/////////////////////////////////////////////////////////////////////////////////////////////

/**
 *  The URITemplate path segment. This is initialized in by the service generator.
 */
@property(atomic, readonly) NSString *pathURITemplate;

/**
 *  The HTTP method to use for this query. This is initialized in by the service generator.
 */
@property(atomic, readonly, nullable) NSString *httpMethod;

/**
 *  The parameters names that are in the URI Template.
 *  This is initialized in by the service generator.
 *
 *  The service generator collects these via the discovery info instead of having to parse the
 *  template to figure out what is part of the path.
 */
@property(atomic, readonly, nullable) NSArray<NSString *> *pathParameterNames;

/**
 *  The JSON dictionary of all the parameters set on this query.
 *
 *  The JSON values are set by setting the query's properties.
 */
@property(nonatomic, strong, nullable) NSMutableDictionary<NSString *, id> *JSON;

/**
 *  A custom URI template for resumable uploads.  This is initialized by the service generator
 *  if needed.
 */
@property(atomic, copy, nullable) NSString *resumableUploadPathURITemplateOverride;

/**
 *  A custom URI template for simple and multipart media uploads.  This is initialized
 *  by the service generator.
 */
@property(atomic, copy, nullable) NSString *simpleUploadPathURITemplateOverride;

/**
 *  The GTLRObject subclass expected for results.  This is initialized by the service generator.
 *
 *  This is needed if the object returned by the server lacks a known "kind" string.
 */
@property(atomic, assign, nullable) Class expectedObjectClass;

/**
 *  Set when the query has been invalidated, meaning it was slated for execution so it's been copied
 *  and its callbacks were released, or it's a copy that has finished executing.
 *
 *  Once a query has been invalidated, it cannot be executed, added to a batch, or copied.
 */
@property(atomic, assign, getter=isQueryInvalid) BOOL queryInvalid;

/**
 *  Internal query init method.
 *
 *  @param pathURITemplate    URI template to be filled in with parameters.
 *  @param httpMethod         The requests's http method. A nil method will execute as GET.
 *  @param pathParameterNames Names of parameters to be replaced in the template.
 */
- (instancetype)initWithPathURITemplate:(NSString *)pathURITemplate
                             HTTPMethod:(nullable NSString *)httpMethod
                     pathParameterNames:(nullable NSArray<NSString *> *)pathParameterNames NS_DESIGNATED_INITIALIZER;

/**
 *  @return Auto-generated request ID string.
 */
+ (NSString *)nextRequestID;

/**
 *  Overridden by subclasses.
 *
 *  @return Substitute parameter names where needed for Objective-C or library compatibility.
 */
+ (nullable NSDictionary<NSString *, NSString *> *)parameterNameMap;

/**
 *  Overridden by subclasses.
 *
 *  @return Map of property keys to specifying the class of objects to be instantiated in arrays.
 */
+ (nullable NSDictionary<NSString *, Class> *)arrayPropertyToClassMap;

- (instancetype)init NS_UNAVAILABLE;

@end

/**
 *  The library doesn't use GTLRQueryCollectionImpl, but it provides a concrete implementation
 *  of the protocol so the methods do not cause private method errors in Xcode/AppStore review.
 */
@interface GTLRQueryCollectionImpl : GTLRQuery <GTLRQueryCollectionProtocol>
@end

NS_ASSUME_NONNULL_END
