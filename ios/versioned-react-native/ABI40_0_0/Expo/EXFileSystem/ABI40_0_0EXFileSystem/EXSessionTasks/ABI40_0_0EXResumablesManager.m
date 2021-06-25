// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXFileSystem/ABI40_0_0EXResumablesManager.h>

@interface ABI40_0_0EXResumablesManager ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, NSURLSessionDownloadTask *> *resumableDownloads;

@end

@implementation ABI40_0_0EXResumablesManager

- (instancetype)init
{
  if (self = [super init]) {
    _resumableDownloads = [NSMutableDictionary dictionary];
  }
  return self;
}

- (void)registerTask:(NSURLSessionDownloadTask *)task uuid:(NSString *)uuid
{
  _resumableDownloads[uuid] = task;
}

- (NSURLSessionDownloadTask * _Nullable)taskForId:(NSString *)uuid
{
  return _resumableDownloads[uuid];
}

- (void)unregisterTask:(NSString *)uuid
{
  [_resumableDownloads removeObjectForKey:uuid];
}

@end
