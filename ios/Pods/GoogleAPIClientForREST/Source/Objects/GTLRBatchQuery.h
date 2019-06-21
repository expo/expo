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

//  Batch query documentation:
//  https://github.com/google/google-api-objectivec-client-for-rest/wiki#batch-operations

#import "GTLRQuery.h"

NS_ASSUME_NONNULL_BEGIN

@interface GTLRBatchQuery : NSObject <GTLRQueryProtocol>

/**
 *  Queries included in this batch.  Each query should have a unique @c requestID.
 */
@property(atomic, copy, nullable) NSArray<GTLRQuery *> *queries;

/**
 *  Flag indicating if query execution should skip authorization. Defaults to NO.
 */
@property(atomic, assign) BOOL shouldSkipAuthorization;

/**
 *  Any additional HTTP headers for this batch.
 *
 *  These headers override the same keys from the service object's
 *  @c additionalHTTPHeaders.
 */
@property(atomic, copy, nullable) NSDictionary<NSString *, NSString *> *additionalHTTPHeaders;

/**
 *  Any additional URL query parameters to add to the batch query.
 *
 *  These query parameters override the same keys from the service object's
 *  @c additionalURLQueryParameters
 */
@property(atomic, copy, nullable) NSDictionary<NSString *, NSString *> *additionalURLQueryParameters;

/**
 *  The batch request multipart boundary, once determined.
 */
@property(atomic, copy, nullable) NSString *boundary;

/**
 *  The brief string to identify this query in @c GTMSessionFetcher http logs.
 *
 *  The default logging name for batch requests includes the API method names.
 */
@property(atomic, copy, nullable) NSString *loggingName;

/**
 *  Constructor for a batch query, for use with @c addQuery:
 */
+ (instancetype)batchQuery;

/**
 *  Constructor for a batch query, from an array of @c GTLRQuery objects.
 */
+ (instancetype)batchQueryWithQueries:(NSArray<GTLRQuery *> *)array;

/**
 *  Add a single @c GTLRQuery to the batch.
 */
- (void)addQuery:(GTLRQuery *)query;

/**
 *  Search the batch for a query with the specified ID.
 */
- (nullable GTLRQuery *)queryForRequestID:(NSString *)requestID;

@end

NS_ASSUME_NONNULL_END
