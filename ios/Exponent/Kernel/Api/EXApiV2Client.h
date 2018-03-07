// Copyright 2015-present 650 Industries. All rights reserved.

@import Foundation;

#import "EXApiV2Result.h"

NS_ASSUME_NONNULL_BEGIN

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
