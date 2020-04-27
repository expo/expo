// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXResumablesManager : NSObject

- (NSURLSessionDownloadTask * _Nullable)taskForId:(NSString *)uuid;

- (void)registerTask:(NSURLSessionDownloadTask *)task uuid:(NSString *)uuid;

- (void)unregisterTask:(NSString *)uuid;

@end

NS_ASSUME_NONNULL_END
