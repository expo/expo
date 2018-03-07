// Copyright 2015-present 650 Industries. All rights reserved.

@import Foundation;

#import "EXApiV2Result.h"

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const EXApiErrorDomain;

typedef NS_ENUM(NSInteger, EXApiErrorCode) {
  EXApiErrorCodeMalformedRequestBody,
  EXApiErrorCodeEmptyResponse,
  EXApiErrorCodeMalformedJson,
  EXApiErrorCodeMalformedResponse,
  EXApiErrorCodeApiError,
};

FOUNDATION_EXPORT NSString * const EXApiResponseKey;
FOUNDATION_EXPORT NSString * const EXApiResultKey;
FOUNDATION_EXPORT NSString * const EXApiHttpStatusCodeKey;
FOUNDATION_EXPORT NSString * const EXApiErrorCodeKey;
FOUNDATION_EXPORT NSString * const EXApiErrorStackKey;

typedef void (^EXApiV2CompletionHandler)(EXApiV2Result * _Nullable response,
                                         NSError * _Nullable error);

@interface EXApiV2Client : NSObject

+ (instancetype)sharedClient;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithUrlSession:(NSURLSession *)urlSession NS_DESIGNATED_INITIALIZER;

- (nullable NSURLSessionTask *)callRemoteMethod:(NSString *)method
                                      arguments:(nullable NSDictionary *)arguments
                                     httpMethod:(NSString *)httpMethod
                              completionHandler:(EXApiV2CompletionHandler)handler;

@end

NS_ASSUME_NONNULL_END
