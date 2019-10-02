// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXAppLoaderProvider/ABI33_0_0EXAppRecordInterface.h>

@protocol ABI33_0_0EXAppLoaderInterface <NSObject>

- (nonnull id<ABI33_0_0EXAppRecordInterface>)loadAppWithUrl:(nonnull NSString *)url
                                           options:(nullable NSDictionary *)options
                                          callback:(void(^)(BOOL success, NSError *error))callback;

@end
