// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXAppLoaderProvider/ABI35_0_0EXAppRecordInterface.h>

@protocol ABI35_0_0EXAppLoaderInterface <NSObject>

- (nonnull id<ABI35_0_0EXAppRecordInterface>)loadAppWithUrl:(nonnull NSString *)url
                                           options:(nullable NSDictionary *)options
                                          callback:(nullable void(^)(BOOL success, NSError * _Nullable error))callback;

@end
