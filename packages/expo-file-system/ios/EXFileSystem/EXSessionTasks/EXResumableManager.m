// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXFileSystem/EXResumableManager.h>

@interface EXResumableManager ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, NSURLSessionDownloadTask *> *resumableDownloads;

@end

@implementation EXResumableManager

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
