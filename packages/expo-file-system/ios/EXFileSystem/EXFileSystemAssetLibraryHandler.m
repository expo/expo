
#import <EXFileSystem/EXFileSystemAssetLibraryHandler.h>

#import <Photos/Photos.h>

@implementation EXFileSystemAssetLibraryHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)options
              resolver:(UMPromiseResolveBlock)resolve
              rejecter:(UMPromiseRejectBlock)reject
{
  PHFetchResult<PHAsset *> *fetchResult = [PHAsset fetchAssetsWithALAssetURLs:@[fileUri] options:nil];
  if (fetchResult.count > 0) {
    PHAsset *asset = fetchResult[0];
    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    result[@"exists"] = @(YES);
    result[@"isDirectory"] = @(NO);
    result[@"uri"] = fileUri;
    result[@"modificationTime"] = @(asset.modificationDate.timeIntervalSince1970);
    if (options[@"md5"] || options[@"size"]) {
      [[PHImageManager defaultManager] requestImageDataForAsset:asset options:nil resultHandler:^(NSData * _Nullable imageData, NSString * _Nullable dataUTI, UIImageOrientation orientation, NSDictionary * _Nullable info) {
        result[@"size"] = @(imageData.length);
        if (options[@"md5"]) {
          result[@"md5"] = [imageData md5String];
        }
        resolve(result);
      }];
    } else {
      resolve(result);
    }
  } else {
    resolve(@{@"exists": @(NO), @"isDirectory": @(NO)});
  }
}

+ (void)copyFrom:(NSURL *)from
              to:(NSURL *)to
        resolver:(UMPromiseResolveBlock)resolve
        rejecter:(UMPromiseRejectBlock)reject
{
  NSString *toPath = [to.path stringByStandardizingPath];
  
  // NOTE: The destination-delete and the copy should happen atomically, but we hope for the best for now
  NSError *error;
  if ([[NSFileManager defaultManager] fileExistsAtPath:toPath]) {
    if (![[NSFileManager defaultManager] removeItemAtPath:toPath error:&error]) {
      reject(@"E_FILE_NOT_COPIED",
             [NSString stringWithFormat:@"File '%@' could not be copied to '%@' because a file already exists at "
              "the destination and could not be deleted.", from, to],
             error);
      return;
    }
  }
  
  PHFetchResult<PHAsset *> *fetchResult = [PHAsset fetchAssetsWithALAssetURLs:@[from] options:nil];
  if (fetchResult.count > 0) {
    PHAsset *asset = fetchResult[0];
    [[PHImageManager defaultManager] requestImageDataForAsset:asset options:nil resultHandler:^(NSData * _Nullable imageData, NSString * _Nullable dataUTI, UIImageOrientation orientation, NSDictionary * _Nullable info) {
      if ([imageData writeToFile:toPath atomically:YES]) {
        resolve(nil);
      } else {
        reject(@"E_FILE_NOT_COPIED",
               [NSString stringWithFormat:@"File '%@' could not be copied to '%@'.", from, to],
               error);
      }
    }];
  } else {
    reject(@"E_FILE_NOT_COPIED",
           [NSString stringWithFormat:@"File '%@' could not be found.", from],
           error);
  }
}

@end
