// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXVideoThumbnails/ABI47_0_0EXVideoThumbnailsModule.h>
#import <AVFoundation/AVFoundation.h>
#import <AVFoundation/AVAsset.h>
#import <UIKit/UIKit.h>

static NSString* const OPTIONS_KEY_QUALITY = @"quality";
static NSString* const OPTIONS_KEY_TIME = @"time";
static NSString* const OPTIONS_KEY_HEADERS = @"headers";

@implementation ABI47_0_0EXVideoThumbnailsModule

ABI47_0_0EX_EXPORT_MODULE(ExpoVideoThumbnails);

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXFileSystemInterface)];
}

ABI47_0_0EX_EXPORT_METHOD_AS(getThumbnail,
                    sourceFilename:(NSString *)source
                    options:(NSDictionary *)options
                    resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  NSURL *url = [NSURL URLWithString:source];
  if ([url isFileURL]) {
    if (!_fileSystem) {
      return reject(@"E_MISSING_MODULE", @"No FileSystem module.", nil);
    }
    if (!([_fileSystem permissionsForURI:url] & ABI47_0_0EXFileSystemPermissionRead)) {
      return reject(@"E_FILESYSTEM_PERMISSIONS", [NSString stringWithFormat:@"File '%@' isn't readable.", source], nil);
    }
  }

  long timeInMs = [(NSNumber *)options[OPTIONS_KEY_TIME] integerValue] ?: 0;
  float quality = [(NSNumber *)options[OPTIONS_KEY_QUALITY] floatValue] ?: 1.0;
  NSDictionary *headers = options[OPTIONS_KEY_HEADERS] ?: @{};

  AVURLAsset *asset = [[AVURLAsset alloc] initWithURL:url options:@{@"AVURLAssetHTTPHeaderFieldsKey": headers}];
  AVAssetImageGenerator *generator = [[AVAssetImageGenerator alloc] initWithAsset:asset];
  generator.appliesPreferredTrackTransform = YES;
  generator.requestedTimeToleranceBefore = kCMTimeZero;
  generator.requestedTimeToleranceAfter = kCMTimeZero;

  NSError *err = NULL;
  CMTime time = CMTimeMake(timeInMs, 1000);

  CGImageRef imgRef = [generator copyCGImageAtTime:time actualTime:NULL error:&err];
  if (err) {
    return reject(@"E_THUM_FAIL", err.localizedFailureReason, err);
  }
  UIImage *thumbnail = [UIImage imageWithCGImage:imgRef];

  NSString *directory = [_fileSystem.cachesDirectory stringByAppendingPathComponent:@"VideoThumbnails"];
  [_fileSystem ensureDirExistsWithPath:directory];

  NSString *fileName = [[[NSUUID UUID] UUIDString] stringByAppendingString:@".jpg"];
  NSString *newPath = [directory stringByAppendingPathComponent:fileName];
  NSData *data = UIImageJPEGRepresentation(thumbnail, quality);
  if (![data writeToFile:newPath atomically:YES]) {
    return reject(@"E_WRITE_ERROR", @"Can't write to file.", nil);
  }
  NSURL *fileURL = [NSURL fileURLWithPath:newPath];
  NSString *filePath = [fileURL absoluteString];

  CGImageRelease(imgRef);
  
  resolve(@{
            @"uri" : filePath,
            @"width" : @(thumbnail.size.width),
            @"height" : @(thumbnail.size.height),
            });
}

@end
