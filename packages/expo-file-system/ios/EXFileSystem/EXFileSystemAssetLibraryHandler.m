
#import <EXFileSystem/EXFileSystemAssetLibraryHandler.h>
#import <EXFileSystem/NSData+EXFileSystem.h>

#import <Photos/Photos.h>

@implementation EXFileSystemAssetLibraryHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)options
              resolver:(EXPromiseResolveBlock)resolve
              rejecter:(EXPromiseRejectBlock)reject
{
  NSError *error;
  PHFetchResult<PHAsset *> *fetchResult = [self fetchResultForUri:fileUri error:&error];
  if (error) {
    reject(@"E_UNSUPPORTED_ARG", error.description, error);
    return;
  }
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
        resolver:(EXPromiseResolveBlock)resolve
        rejecter:(EXPromiseRejectBlock)reject
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

  PHFetchResult<PHAsset *> *fetchResult = [self fetchResultForUri:from error:&error];
  if (error) {
    reject(@"E_UNSUPPORTED_ARG", error.description, error);
    return;
  }

  if (fetchResult.count > 0) {
    PHAsset *asset = fetchResult[0];
    if (asset.mediaType == PHAssetMediaTypeVideo) {
      [[PHImageManager defaultManager] requestAVAssetForVideo:asset options:nil resultHandler:^(AVAsset *asset, AVAudioMix *audioMix, NSDictionary *info) {
        if (![asset isKindOfClass:[AVURLAsset class]]) {
          reject(@"ERR_INCORRECT_ASSET_TYPE",
                 [NSString stringWithFormat:@"File '%@' has incorrect asset type.", from],
                 nil);
          return;
        }
       
        AVURLAsset* urlAsset = (AVURLAsset*)asset;
        NSNumber *size;
        [urlAsset.URL getResourceValue:&size forKey:NSURLFileSizeKey error:nil];
        NSData *data = [NSData dataWithContentsOfURL:urlAsset.URL];
         
        [EXFileSystemAssetLibraryHandler copyData:data toPath:toPath resolver:resolve rejecter:reject];
      }];
    } else {
      [[PHImageManager defaultManager] requestImageDataForAsset:asset options:nil resultHandler:^(NSData * _Nullable imageData, NSString * _Nullable dataUTI, UIImageOrientation orientation, NSDictionary * _Nullable info) {
        [EXFileSystemAssetLibraryHandler copyData:imageData toPath:toPath resolver:resolve rejecter:reject];
      }];
    }
  } else {
    reject(@"E_FILE_NOT_COPIED",
           [NSString stringWithFormat:@"File '%@' could not be found.", from],
           error);
  }
}

// adapted from RCTImageLoader.m
+ (PHFetchResult<PHAsset *> *)fetchResultForUri:(NSURL *)url error:(NSError **)error
{
  if ([url.scheme caseInsensitiveCompare:@"ph"] == NSOrderedSame) {
    // Fetch assets using PHAsset localIdentifier (recommended)
    NSString *const localIdentifier = [url.absoluteString substringFromIndex:@"ph://".length];
    return [PHAsset fetchAssetsWithLocalIdentifiers:@[localIdentifier] options:nil];
  } else if ([url.scheme caseInsensitiveCompare:@"assets-library"] == NSOrderedSame) {
#if TARGET_OS_MACCATALYST
    static BOOL hasWarned = NO;
    if (!hasWarned) {
      NSLog(@"assets-library:// URLs have been deprecated and cannot be accessed in macOS Catalyst. Returning nil (future warnings will be suppressed).");
      hasWarned = YES;
    }
    return nil;
#else
    // This is the older, deprecated way of fetching assets from assets-library
    // using the "assets-library://" protocol
    return [PHAsset fetchAssetsWithALAssetURLs:@[url] options:nil];
#endif
  }

  NSString *description = [NSString stringWithFormat:@"Invalid URL provided, expected scheme to be either 'ph' or 'assets-library', was '%@'.", url.scheme];
  *error = [[NSError alloc] initWithDomain:NSURLErrorDomain
                                      code:NSURLErrorUnsupportedURL
                                  userInfo:@{NSLocalizedDescriptionKey: description}];
  return nil;
}


+ (void)copyData:(NSData *)data
          toPath:(NSString *)path
        resolver:(EXPromiseResolveBlock)resolve
        rejecter:(EXPromiseRejectBlock)reject
{
  if ([data writeToFile:path atomically:YES]) {
    resolve(nil);
  } else {
    reject(@"E_FILE_NOT_COPIED",
           [NSString stringWithFormat:@"File could not be copied to '%@'.", path],
           nil);
  }
}

@end
