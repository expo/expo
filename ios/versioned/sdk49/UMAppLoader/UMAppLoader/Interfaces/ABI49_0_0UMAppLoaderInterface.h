// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0UMAppLoader/ABI49_0_0UMAppRecordInterface.h>

@protocol ABI49_0_0UMAppLoaderInterface <NSObject>

- (nonnull id<ABI49_0_0UMAppRecordInterface>)loadAppWithUrl:(nonnull NSString *)url
                                           options:(nullable NSDictionary *)options
                                          callback:(nullable void(^)(BOOL success, NSError * _Nullable error))callback;

@end
