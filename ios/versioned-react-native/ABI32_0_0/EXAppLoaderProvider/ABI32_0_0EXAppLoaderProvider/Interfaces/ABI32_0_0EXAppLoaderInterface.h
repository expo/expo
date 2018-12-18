// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXAppLoaderProvider/ABI32_0_0EXAppRecordInterface.h>

@protocol ABI32_0_0EXAppLoaderInterface <NSObject>

- (nonnull id<ABI32_0_0EXAppRecordInterface>)loadAppWithUrl:(nonnull NSString *)url
                                           options:(nullable NSDictionary *)options
                                          callback:(void(^)(BOOL success, NSError *error))callback;

@end
