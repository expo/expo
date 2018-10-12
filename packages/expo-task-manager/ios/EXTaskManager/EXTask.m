// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXTaskManager/EXTask.h>

@implementation EXTask

- (instancetype)initWithName:(nonnull NSString *)name
                       appId:(nonnull NSString *)appId
                      appUrl:(nonnull NSString *)appUrl
               consumerClass:(Class)consumerClass
                     options:(nullable NSDictionary *)options
                    delegate:(nullable id<EXTaskDelegate>)delegate
{
  if (self = [super init]) {
    _name = name;
    _appId = appId;
    _appUrl = appUrl;
    _consumer = [consumerClass new];
    _options = options;
    _delegate = delegate;
  }
  return self;
}

- (void)executeWithData:(nullable NSDictionary *)data withError:(nullable NSError *)error
{
  [_delegate executeTask:self withData:data withError:error];
}

@end
