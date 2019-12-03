// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAppLoaderProvider/EXAppRecordInterface.h>

@protocol EXAppLoaderInterface <NSObject>

- (nonnull id<EXAppRecordInterface>)loadAppWithUrl:(nonnull NSString *)url
                                           options:(nullable NSDictionary *)options
                                          callback:(nullable void(^)(BOOL success, NSError * _Nullable error))callback;

@end
