// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXApiV2Result.h"

NS_ASSUME_NONNULL_BEGIN

@implementation EXApiV2Result

- (instancetype)initWithData:(nullable id<NSCopying>)data
                       error:(nullable NSError *)error
              httpStatusCode:(NSInteger)statusCode
{
  if (self = [super init]) {
    _data = data;
    _error = error;
    _httpStatusCode = statusCode;
  }
  return self;
}

- (BOOL)isSuccessful
{
  return _httpStatusCode >= 200 && _httpStatusCode < 300 && !_error;
}

@end

NS_ASSUME_NONNULL_END
