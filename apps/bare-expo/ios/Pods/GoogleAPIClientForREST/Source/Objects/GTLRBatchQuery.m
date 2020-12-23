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

#import "GTLRBatchQuery.h"

#import "GTLRDefines.h"
#import "GTLRService.h"

#if DEBUG
static void DebugAssertValidBatchQueryItem(GTLRQuery *query) {
  GTLR_DEBUG_ASSERT([query isKindOfClass:[GTLRQuery class]],
                    @"unexpected query class: %@", [query class]);
  GTLR_DEBUG_ASSERT(query.uploadParameters == nil,
                    @"batch may not contain upload: %@", query);
  GTLR_DEBUG_ASSERT(!query.hasExecutionParameters,
                    @"queries added to a batch may not contain executionParameters: %@", query);
  GTLR_DEBUG_ASSERT(!query.queryInvalid,
                    @"batch may not contain query already executed: %@", query);
}
#else
static void DebugAssertValidBatchQueryItem(GTLRQuery *query) { }
#endif

@implementation GTLRBatchQuery {
  NSMutableArray<GTLRQuery *> *_queries;
  NSMutableDictionary *_requestIDMap;
  GTLRServiceExecutionParameters *_executionParameters;
}

@synthesize shouldSkipAuthorization = _shouldSkipAuthorization,
            additionalHTTPHeaders = _additionalHTTPHeaders,
            additionalURLQueryParameters = _additionalURLQueryParameters,
            boundary = _boundary,
            loggingName = _loggingName;

+ (instancetype)batchQuery {
  GTLRBatchQuery *obj = [[self alloc] init];
  return obj;
}

+ (instancetype)batchQueryWithQueries:(NSArray<GTLRQuery *> *)queries {
  GTLRBatchQuery *obj = [self batchQuery];
  obj.queries = queries;

#if DEBUG
  for (GTLRQuery *query in queries) {
    DebugAssertValidBatchQueryItem(query);
  }
#endif
  return obj;
}

- (id)copyWithZone:(NSZone *)zone {
  // Deep copy the list of queries
  GTLRBatchQuery *newBatch = [[[self class] allocWithZone:zone] init];
  if (_queries) {
    newBatch.queries = [[NSArray alloc] initWithArray:_queries
                                            copyItems:YES];
  }

  // Using the executionParameters ivar avoids creating the object.
  newBatch.executionParameters = _executionParameters;

  // Copied in the same order as synthesized above.
  newBatch.shouldSkipAuthorization = _shouldSkipAuthorization;
  newBatch.additionalHTTPHeaders = _additionalHTTPHeaders;
  newBatch.additionalURLQueryParameters = _additionalURLQueryParameters;
  newBatch.boundary = _boundary;
  newBatch.loggingName = _loggingName;

  // No need to copy _requestIDMap as it's created on demand.
  return newBatch;
}

- (NSString *)description {
  NSArray *queries = self.queries;
  NSArray *loggingNames = [queries valueForKey:@"loggingName"];
  NSMutableSet *dedupedNames = [NSMutableSet setWithArray:loggingNames]; // de-dupe
  [dedupedNames removeObject:[NSNull null]];  // In case any didn't have a loggingName.
  NSString *namesStr = [[dedupedNames allObjects] componentsJoinedByString:@","];

  return [NSString stringWithFormat:@"%@ %p (queries:%lu - %@)",
          [self class], self, (unsigned long)queries.count, namesStr];
}

#pragma mark -

- (BOOL)isBatchQuery {
  return YES;
}

- (GTLRUploadParameters *)uploadParameters {
  // File upload is not supported for batches
  return nil;
}

- (void)invalidateQuery {
  NSArray *queries = self.queries;
  [queries makeObjectsPerformSelector:@selector(invalidateQuery)];

  _executionParameters = nil;
}

- (GTLRQuery *)queryForRequestID:(NSString *)requestID {
  GTLRQuery *result = [_requestIDMap objectForKey:requestID];
  if (result) return result;

  // We've not before tried to look up a query, or the map is stale
  _requestIDMap = [[NSMutableDictionary alloc] init];

  for (GTLRQuery *query in _queries) {
    [_requestIDMap setObject:query forKey:query.requestID];
  }

  result = [_requestIDMap objectForKey:requestID];
  return result;
}

#pragma mark -

- (void)setQueries:(NSArray<GTLRQuery *> *)array {
#if DEBUG
  for (GTLRQuery *query in array) {
    DebugAssertValidBatchQueryItem(query);
  }
#endif

  _queries = [array mutableCopy];
}

- (NSArray<GTLRQuery *> *)queries {
  return _queries;
}

- (void)addQuery:(GTLRQuery *)query {
  DebugAssertValidBatchQueryItem(query);

  if (_queries == nil) {
    _queries = [[NSMutableArray alloc] init];
  }

  [_queries addObject:query];
}

- (GTLRServiceExecutionParameters *)executionParameters {
  @synchronized(self) {
    if (!_executionParameters) {
      _executionParameters = [[GTLRServiceExecutionParameters alloc] init];
    }
  }
  return _executionParameters;
}

- (void)setExecutionParameters:(GTLRServiceExecutionParameters *)executionParameters {
  @synchronized(self) {
    _executionParameters = executionParameters;
  }
}

- (BOOL)hasExecutionParameters {
  return _executionParameters.hasParameters;
}

@end
