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

// GTMSessionUploadFetcher implements Google's resumable upload protocol.

//
// This subclass of GTMSessionFetcher simulates the series of fetches
// needed for chunked upload as a single fetch operation.
//
// Protocol document:  TBD
//
// To the client, the only fetcher that exists is this class; the subsidiary
// fetchers needed for uploading chunks are not visible (though the most recent
// chunk fetcher may be accessed via the -activeFetcher or -chunkFetcher methods, and
// -responseHeaders and -statusCode reflect results from the most recent chunk
// fetcher.)
//
// Chunk fetchers are discarded as soon as they have completed.
//
// The protocol also allows for a cancellation notification request to be sent to the
// server to allow discarding of the currently uploaded data and this will be sent
// automatically upon calling stopFetching if the upload has already started.
//
// Note: Unlike the fetcher superclass, the methods of GTMSessionUploadFetcher should
// only be used from the main thread until further work is done to make this subclass
// thread-safe.

#import "GTMSessionFetcher.h"
#import "GTMSessionFetcherService.h"

GTM_ASSUME_NONNULL_BEGIN

// The value to use for file size parameters when the file size is not yet known.
extern int64_t const kGTMSessionUploadFetcherUnknownFileSize;

// Unless an application knows it needs a smaller chunk size, it should use the standard
// chunk size, which sends the entire file as a single chunk to minimize upload overhead.
// Setting an explicit chunk size that comfortably fits in memory is advisable for large
// uploads.
extern int64_t const kGTMSessionUploadFetcherStandardChunkSize;

// When uploading requires data buffer allocations (such as uploading from an NSData or
// an NSFileHandle) this is the maximum buffer size that will be created by the fetcher.
extern int64_t const kGTMSessionUploadFetcherMaximumDemandBufferSize;

// Notification that the upload location URL was provided by the server.
extern NSString *const kGTMSessionFetcherUploadLocationObtainedNotification;

// Block to provide data during uploads.
//
// Response data may be allocated with dataWithBytesNoCopy:length:freeWhenDone: for efficiency,
// and released after the response block returns.
//
// If the length of the file being uploaded is unknown or already set, send
// kGTMSessionUploadFetcherUnknownFileSize for |fullUploadLength|. Otherwise, set |fullUploadLength|
// to its proper value.
//
// Pass nil as the data (and optionally an NSError) for a failure.
typedef void (^GTMSessionUploadFetcherDataProviderResponse)(NSData * GTM_NULLABLE_TYPE data,
                                                            int64_t fullUploadLength,
                                                            NSError * GTM_NULLABLE_TYPE error);
// Do not call the response with an NSData object with less data than the requested length unless
// you are passing the fullUploadLength to the fetcher for the first time and it is the last chunk
// of data in the file being uploaded.
typedef void (^GTMSessionUploadFetcherDataProvider)(int64_t offset, int64_t length,
    GTMSessionUploadFetcherDataProviderResponse response);

// Block to be notified about the final status of the cancellation request started in stopFetching.
//
// |fetcher| will be the cancel request that was sent to the server, or nil if stopFetching is not
// going to send a cancel request. If |fetcher| is provided, the other parameters correspond to the
// completion handler of the cancellation request fetcher.
typedef void (^GTMSessionUploadFetcherCancellationHandler)(
    GTMSessionFetcher * GTM_NULLABLE_TYPE fetcher,
    NSData * GTM_NULLABLE_TYPE data,
    NSError * GTM_NULLABLE_TYPE error);

@interface GTMSessionUploadFetcher : GTMSessionFetcher

// Create an upload fetcher specifying either the request or the resume location URL,
// then set an upload data source using one of these:
//
//   setUploadFileURL:
//   setUploadDataLength:provider:
//   setUploadFileHandle:
//   setUploadData:

+ (instancetype)uploadFetcherWithRequest:(NSURLRequest *)request
                          uploadMIMEType:(NSString *)uploadMIMEType
                               chunkSize:(int64_t)chunkSize
                          fetcherService:(GTM_NULLABLE GTMSessionFetcherService *)fetcherServiceOrNil;

// Allows cellular access.
+ (instancetype)uploadFetcherWithLocation:(NSURL * GTM_NULLABLE_TYPE)uploadLocationURL
                           uploadMIMEType:(NSString *)uploadMIMEType
                                chunkSize:(int64_t)chunkSize
                           fetcherService:(GTM_NULLABLE GTMSessionFetcherService *)fetcherServiceOrNil;

+ (instancetype)uploadFetcherWithLocation:(NSURL *GTM_NULLABLE_TYPE)uploadLocationURL
                           uploadMIMEType:(NSString *)uploadMIMEType
                                chunkSize:(int64_t)chunkSize
                     allowsCellularAccess:(BOOL)allowsCellularAccess
                           fetcherService:(GTM_NULLABLE GTMSessionFetcherService *)fetcherServiceOrNil;

// Allows dataProviders for files of unknown length. Pass kGTMSessionUploadFetcherUnknownFileSize as
// |fullLength| if the length is unknown.
- (void)setUploadDataLength:(int64_t)fullLength
                   provider:(GTM_NULLABLE GTMSessionUploadFetcherDataProvider)block;

+ (NSArray *)uploadFetchersForBackgroundSessions;
+ (GTM_NULLABLE instancetype)uploadFetcherForSessionIdentifier:(NSString *)sessionIdentifier;

- (void)pauseFetching;
- (void)resumeFetching;
- (BOOL)isPaused;

@property(atomic, strong, GTM_NULLABLE) NSURL *uploadLocationURL;
@property(atomic, strong, GTM_NULLABLE) NSData *uploadData;
@property(atomic, strong, GTM_NULLABLE) NSURL *uploadFileURL;
@property(atomic, strong, GTM_NULLABLE) NSFileHandle *uploadFileHandle;
@property(atomic, copy, readonly, GTM_NULLABLE) GTMSessionUploadFetcherDataProvider uploadDataProvider;
@property(atomic, copy) NSString *uploadMIMEType;
@property(atomic, readonly, assign) int64_t chunkSize;
@property(atomic, readonly, assign) int64_t currentOffset;
// Reflects the original NSURLRequest's @c allowCellularAccess property.
@property(atomic, readonly, assign) BOOL allowsCellularAccess;

// The fetcher for the current data chunk, if any
@property(atomic, strong, GTM_NULLABLE) GTMSessionFetcher *chunkFetcher;

// The active fetcher is the current chunk fetcher, or the upload fetcher itself
// if no chunk fetcher has yet been created.
@property(atomic, readonly) GTMSessionFetcher *activeFetcher;

// The last request made by an active fetcher.  Useful for testing.
@property(atomic, readonly, GTM_NULLABLE) NSURLRequest *lastChunkRequest;

// The status code from the most recently-completed fetch.
@property(atomic, assign) NSInteger statusCode;

// Invoked as part of the stop fetching process. Invoked immediately if there is no upload in
// progress, otherwise invoked with the results of the attempt to notify the server that the
// upload will not continue.
//
// Unlike other callbacks, since this is related specifically to the stopFetching flow it is not
// cleared by stopFetching. It will instead clear itself after it is invoked or if the completion
// has occured before stopFetching is called.
@property(atomic, copy, GTM_NULLABLE) GTMSessionUploadFetcherCancellationHandler
    cancellationHandler;

// Exposed for testing only.
@property(atomic, readonly, GTM_NULLABLE) dispatch_queue_t delegateCallbackQueue;
@property(atomic, readonly, GTM_NULLABLE) GTMSessionFetcherCompletionHandler delegateCompletionHandler;

@end

@interface GTMSessionFetcher (GTMSessionUploadFetcherMethods)

@property(readonly, GTM_NULLABLE) GTMSessionUploadFetcher *parentUploadFetcher;

@end

GTM_ASSUME_NONNULL_END
