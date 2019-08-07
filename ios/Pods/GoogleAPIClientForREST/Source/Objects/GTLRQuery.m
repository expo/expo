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

#include <objc/runtime.h>

#import "GTLRQuery.h"
#import "GTLRRuntimeCommon.h"
#import "GTLRService.h"
#import "GTLRUtilities.h"

@interface GTLRQuery () <GTLRRuntimeCommon>
@end

@implementation GTLRQuery {
  NSMutableDictionary *_childCache;
  GTLRServiceExecutionParameters *_executionParameters;
}

@synthesize additionalURLQueryParameters = _additionalURLQueryParameters,
            additionalHTTPHeaders = _additionalHTTPHeaders,
            bodyObject = _bodyObject,
            completionBlock = _completionBlock,
            downloadAsDataObjectType = _downloadAsDataObjectType,
            expectedObjectClass = _expectedObjectClass,
            httpMethod = _httpMethod,
            JSON = _json,
            loggingName = _loggingName,
            pathParameterNames = _pathParameterNames,
            pathURITemplate = _pathURITemplate,
            queryInvalid = _queryInvalid,
            requestID = _requestID,
            resumableUploadPathURITemplateOverride = _resumableUploadPathURITemplateOverride,
            shouldSkipAuthorization = _shouldSkipAuthorization,
            simpleUploadPathURITemplateOverride = _simpleUploadPathURITemplateOverride,
            uploadParameters = _uploadParameters,
            useMediaDownloadService = _useMediaDownloadService;

#if DEBUG
- (instancetype)init {
  [self doesNotRecognizeSelector:_cmd];
  self = nil;
  return self;
}
#endif

- (instancetype)initWithPathURITemplate:(NSString *)pathURITemplate
                             HTTPMethod:(nullable NSString *)httpMethod
                     pathParameterNames:(nullable NSArray<NSString *> *)pathParameterNames {
  self = [super init];
  if (self) {
    _requestID = [[self class] nextRequestID];

    _pathURITemplate = [pathURITemplate copy];
    _httpMethod = [httpMethod copy];
    _pathParameterNames = [pathParameterNames copy];

    if (_pathURITemplate.length == 0) {
      self = nil;
    }
  }
  return self;
}

- (id)copyWithZone:(NSZone *)zone {
  GTLR_DEBUG_ASSERT(!self.queryInvalid, @"Cannot copy an executed query: %@", self);

  GTLRQuery *query =
      [[[self class] allocWithZone:zone] initWithPathURITemplate:self.pathURITemplate
                                                      HTTPMethod:self.httpMethod
                                              pathParameterNames:self.pathParameterNames];

  if (_json.count > 0) {
    // Deep copy the parameters
    CFPropertyListRef ref = CFPropertyListCreateDeepCopy(kCFAllocatorDefault,
                                                         (__bridge CFPropertyListRef)(_json),
                                                         kCFPropertyListMutableContainers);
    query.JSON = CFBridgingRelease(ref);
  }

  // Using the executionParameters ivar avoids creating the object.
  query.executionParameters = self.executionParameters;

  // Copied in the same order as synthesized above.
  query.additionalHTTPHeaders = self.additionalHTTPHeaders;
  query.additionalURLQueryParameters = self.additionalURLQueryParameters;
  query.bodyObject = self.bodyObject;
  query.completionBlock = self.completionBlock;
  query.downloadAsDataObjectType = self.downloadAsDataObjectType;
  query.expectedObjectClass = self.expectedObjectClass;
  // http method passed to init above.
  // JSON copied above.
  query.loggingName = self.loggingName;
  // pathParameterNames passed to init above.
  // pathURITemplate passed to init above.
  query.queryInvalid = self.queryInvalid;
  query.requestID = self.requestID;
  query.resumableUploadPathURITemplateOverride = self.resumableUploadPathURITemplateOverride;
  query.shouldSkipAuthorization = self.shouldSkipAuthorization;
  query.simpleUploadPathURITemplateOverride = self.simpleUploadPathURITemplateOverride;
  query.uploadParameters = self.uploadParameters;
  query.useMediaDownloadService = self.useMediaDownloadService;

  return query;
}

#if DEBUG
- (NSString *)description {
  NSArray *keys = self.JSON.allKeys;
  NSArray *params = [keys sortedArrayUsingSelector:@selector(compare:)];
  NSString *paramsSummary = @"";
  if (params.count > 0) {
    paramsSummary = [NSString stringWithFormat:@" params:(%@)",
                     [params componentsJoinedByString:@","]];
  }

  NSString *invalidStr = @"";
  if (self.queryInvalid) {
    invalidStr = @" [callbacks released]";
  }

  keys = self.additionalURLQueryParameters.allKeys;
  NSArray *urlQParams = [keys sortedArrayUsingSelector:@selector(compare:)];
  NSString *urlQParamsSummary = @"";
  if (urlQParams.count > 0) {
    urlQParamsSummary = [NSString stringWithFormat:@" urlQParams:(%@)",
                        [urlQParams componentsJoinedByString:@","]];
  }

  GTLRObject *bodyObj = self.bodyObject;
  NSString *bodyObjSummary = @"";
  if (bodyObj != nil) {
    bodyObjSummary = [NSString stringWithFormat:@" bodyObject:%@", [bodyObj class]];
  }

  NSString *uploadStr = @"";
  GTLRUploadParameters *uploadParams = self.uploadParameters;
  if (uploadParams) {
    uploadStr = [NSString stringWithFormat:@" %@", uploadParams];
  }

  NSString *httpMethod = self.httpMethod;
  if (httpMethod == nil) {
    httpMethod = @"GET";
  }

  NSString *dataObjectType = self.downloadAsDataObjectType;
  NSString *downloadStr = @"";
  if (dataObjectType.length > 0) {
    downloadStr =
      [NSString stringWithFormat:@" downloadDataAs:%@", dataObjectType];
  }

  return [NSString stringWithFormat:@"%@ %p:%@%@ {%@ pathTemplate:%@%@%@%@%@}",
          [self class], self, invalidStr, downloadStr,
          httpMethod, self.pathURITemplate,
          paramsSummary, urlQParamsSummary,  bodyObjSummary, uploadStr];
}
#endif  // DEBUG

- (BOOL)isBatchQuery {
  return NO;
}

- (void)invalidateQuery {
  self.queryInvalid = YES;
  self.completionBlock = nil;
  self.executionParameters = nil;
}

- (GTLRServiceExecutionParameters *)executionParameters {
  @synchronized(self) {
    if (!_executionParameters) {
      _executionParameters = [[GTLRServiceExecutionParameters alloc] init];
    }
    return _executionParameters;
  }
}

- (void)setExecutionParameters:(nullable GTLRServiceExecutionParameters *)executionParameters {
  @synchronized(self) {
    _executionParameters = executionParameters;
  }
}

- (BOOL)hasExecutionParameters {
  return self.executionParameters.hasParameters;
}

+ (NSString *)nextRequestID {
  static NSUInteger lastRequestID = 0;
  NSString *result;

  @synchronized([GTLRQuery class]) {
    ++lastRequestID;
    result = [NSString stringWithFormat:@"gtlr_%tu", lastRequestID];
  }
  return result;
}

#pragma mark GTLRRuntimeCommon Support

- (void)setJSONValue:(id)obj forKey:(NSString *)key {
  NSMutableDictionary *dict = self.JSON;
  if (dict == nil && obj != nil) {
    dict = [NSMutableDictionary dictionaryWithCapacity:1];
    self.JSON = dict;
  }
  [dict setValue:obj forKey:key];
}

- (id)JSONValueForKey:(NSString *)key {
  id obj = [self.JSON objectForKey:key];
  return obj;
}

// There is no property for _childCache as there shouldn't be KVC/KVO
// support for it, since it's an implementation detail.

- (void)setCacheChild:(id)obj forKey:(NSString *)key {
  if (_childCache == nil && obj != nil) {
    _childCache = [[NSMutableDictionary alloc] initWithObjectsAndKeys:obj, key, nil];
  } else {
    [_childCache setValue:obj forKey:key];
  }
}

- (id)cacheChildForKey:(NSString *)key {
  id obj = [_childCache objectForKey:key];
  return obj;
}

#pragma mark Methods for Subclasses to Override

+ (NSDictionary<NSString *, NSString *> *)parameterNameMap {
  return nil;
}

+ (NSDictionary<NSString *, Class> *)arrayPropertyToClassMap {
  return nil;
}

#pragma mark Runtime Utilities

static NSMutableDictionary *gQueryParameterNameMapCache = nil;
static NSMutableDictionary *gQueryArrayPropertyToClassMapCache = nil;

+ (void)initialize {
  // Note that +initialize is guaranteed by the runtime to be called in a thread-safe manner.
  if (gQueryParameterNameMapCache == nil) {
    gQueryParameterNameMapCache = [[NSMutableDictionary alloc] init];
  }
  if (gQueryArrayPropertyToClassMapCache == nil) {
    gQueryArrayPropertyToClassMapCache = [[NSMutableDictionary alloc] init];
  }
}

+ (NSDictionary *)propertyToJSONKeyMapForClass:(Class<GTLRRuntimeCommon>)aClass {
  NSDictionary *resultMap =
    [GTLRRuntimeCommon mergedClassDictionaryForSelector:@selector(parameterNameMap)
                                             startClass:aClass
                                          ancestorClass:[GTLRQuery class]
                                                  cache:gQueryParameterNameMapCache];
  return resultMap;
}

+ (NSDictionary *)arrayPropertyToClassMapForClass:(Class<GTLRRuntimeCommon>)aClass {
  NSDictionary *resultMap =
    [GTLRRuntimeCommon mergedClassDictionaryForSelector:@selector(arrayPropertyToClassMap)
                                             startClass:aClass
                                          ancestorClass:[GTLRQuery class]
                                                  cache:gQueryArrayPropertyToClassMapCache];
  return resultMap;
}

#pragma mark Runtime Support

- (id<GTLRObjectClassResolver>)objectClassResolver {
  // Stub method just needed for RuntimeCommon.
  return nil;
}

+ (Class<GTLRRuntimeCommon>)ancestorClass {
  return [GTLRQuery class];
}

+ (BOOL)resolveInstanceMethod:(SEL)sel {
  BOOL resolved = [GTLRRuntimeCommon resolveInstanceMethod:sel onClass:self];
  if (resolved) return YES;

  return [super resolveInstanceMethod:sel];
}

@end

@implementation GTLRQueryCollectionImpl
@dynamic pageToken;
@end
