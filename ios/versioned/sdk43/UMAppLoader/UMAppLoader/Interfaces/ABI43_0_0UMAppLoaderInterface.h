// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0UMAppLoader/ABI43_0_0UMAppRecordInterface.h>

@protocol ABI43_0_0UMAppLoaderInterface <NSObject>

- (nonnull id<ABI43_0_0UMAppRecordInterface>)loadAppWithUrl:(nonnull NSString *)url
                                           options:(nullable NSDictionary *)options
                                          callback:(nullable void(^)(BOOL success, NSError * _Nullable error))callback;

@end
