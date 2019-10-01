// Copyright 2015-present 650 Industries. All rights reserved.

@import Foundation;

NS_ASSUME_NONNULL_BEGIN

@interface EXApiV2Result : NSObject

@property (nonatomic, readonly) BOOL successful;
@property (nullable, strong, nonatomic, readonly) NSError *error;
@property (nullable, strong, nonatomic, readonly) id<NSObject> data;
@property (nonatomic, readonly) NSInteger httpStatusCode;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithData:(nullable id<NSObject>)data
                       error:(nullable NSError *)error
              httpStatusCode:(NSInteger)statusCode NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END

