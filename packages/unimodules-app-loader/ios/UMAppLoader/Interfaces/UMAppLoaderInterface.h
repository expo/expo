// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMAppLoader/UMAppRecordInterface.h>

@protocol UMAppLoaderInterface <NSObject>

- (nonnull id<UMAppRecordInterface>)loadAppWithUrl:(nonnull NSString *)url
                                           options:(nullable NSDictionary *)options
                                          callback:(nullable void(^)(BOOL success, NSError * _Nullable error))callback;

@end
