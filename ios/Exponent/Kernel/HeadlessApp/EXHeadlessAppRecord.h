// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXKernelAppRecord.h"
#import "EXReactAppManager.h"
#import "EXAbstractLoader.h"

#import <UMAppLoader/UMAppRecordInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXHeadlessAppRecord : EXKernelAppRecord <UMAppRecordInterface, EXReactAppManagerUIDelegate, EXAppLoaderDelegate>

- (nonnull instancetype)initWithManifestUrl:(NSURL *)manifestUrl
                                   callback:(void(^)(BOOL success, NSError * _Nullable error))callback;

@end

NS_ASSUME_NONNULL_END
