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

#import "GTLRObject.h"

NS_ASSUME_NONNULL_BEGIN

@class GTLRErrorObject;

/**
 *  A batch result includes a dictionary of successes, a dictionary of failures, and a dictionary of
 *  HTTP response headers.
 *
 *  Dictionary keys are request ID strings; dictionary values are @c GTLRObject for
 *  successes, @c GTLRErrorObject for failures, @c NSDictionary for responseHeaders.
 *
 *  For successes with no returned object (such as from delete operations),
 *  the object for the dictionary entry is @c NSNull.
 *
 *  The original query for each result is available from the service ticket, as shown in
 *  the code snippet here.
 *
 *  When the queries in the batch are unrelated, adding a @c completionBlock to each of
 *  the queries may be a simpler way to handle the batch results.
 *
 *  @code
 *  NSDictionary *successes = batchResults.successes;
 *  for (NSString *requestID in successes) {
 *    GTLRObject *obj = successes[requestID];
 *    GTLRQuery *query = [ticket queryForRequestID:requestID];
 *    NSLog(@"Query %@ returned object %@", query, obj);
 *  }
 *
 *  NSDictionary *failures = batchResults.failures;
 *  for (NSString *requestID in failures) {
 *    GTLRErrorObject *errorObj = failures[requestID];
 *    GTLRQuery *query = [ticket queryForRequestID:requestID];
 *    NSLog(@"Query %@ failed with error %@", query, errorObj);
 *  }
 *  @endcode
 */
@interface GTLRBatchResult : GTLRObject

/**
 *  Object results of successful queries in the batch, keyed by request ID.
 *
 *  Queries which do not return an object when successful have a @c NSNull value.
 */
@property(atomic, strong, nullable) NSDictionary<NSString *, __kindof GTLRObject *> *successes;

/**
 *  Object results of unsuccessful queries in the batch, keyed by request ID.
 */
@property(atomic, strong, nullable) NSDictionary<NSString *, GTLRErrorObject *> *failures;

/**
 * Any HTTP response headers that were returned for a query request. Headers are optional therefore
 * not all queries will have them. Query request with response headers are stored in a
 * dictionary and keyed by request ID.
 */
@property(atomic, strong, nullable)
    NSDictionary<NSString *, NSDictionary *> *responseHeaders;

@end

NS_ASSUME_NONNULL_END
