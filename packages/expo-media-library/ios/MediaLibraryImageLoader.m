// Copyright 2015-present 650 Industries. All rights reserved.

// Prior to React Native 0.61, it contained `RCTAssetsLibraryRequestHandler` that handles loading data from URLs
// with `assets-library://` or `ph://` schemes. Due to lean core project, it's been moved to `@react-native-community/cameraroll`
// and that made it impossible to render assets using URLs returned by MediaLibrary without installing CameraRoll.
// Because it's still a unimodule and we need to export bare React Native module, we should make sure React Native is installed.
#if __has_include(<React/RCTImageURLLoader.h>)

#import <Photos/Photos.h>
#import <React/RCTDefines.h>
#import <React/RCTUtils.h>
#import <React/RCTBridgeModule.h>
#import <ExpoMediaLibrary/MediaLibraryImageLoader.h>

@implementation MediaLibraryImageLoader

RCT_EXPORT_MODULE()

#pragma mark - RCTImageURLLoader

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  if (![PHAsset class]) {
    return NO;
  }
  return [requestURL.scheme caseInsensitiveCompare:@"assets-library"] == NSOrderedSame ||
    [requestURL.scheme caseInsensitiveCompare:@"ph"] == NSOrderedSame;
}

- (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(RCTResizeMode)resizeMode
                                   progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                partialLoadHandler:(RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  // Using PhotoKit for iOS 8+
  // The 'ph://' prefix is used by FBMediaKit to differentiate between
  // assets-library. It is prepended to the local ID so that it is in the
  // form of an NSURL which is what assets-library uses.
  NSString *assetID = @"";
  PHFetchResult *results;
  if (!imageURL) {
    completionHandler(RCTErrorWithMessage(@"Cannot load a photo library asset with no URL"), nil);
    return ^{};
  } else if ([imageURL.scheme caseInsensitiveCompare:@"assets-library"] == NSOrderedSame) {
    assetID = [imageURL absoluteString];
    results = [PHAsset fetchAssetsWithALAssetURLs:@[imageURL] options:nil];
  } else {
    assetID = [imageURL.absoluteString substringFromIndex:@"ph://".length];
    results = [PHAsset fetchAssetsWithLocalIdentifiers:@[assetID] options:nil];
  }
  if (results.count == 0) {
    NSString *errorText = [NSString stringWithFormat:@"Failed to fetch PHAsset with local identifier %@ with no error message.", assetID];
    completionHandler(RCTErrorWithMessage(errorText), nil);
    return ^{};
  }

  PHAsset *asset = [results firstObject];
  PHImageRequestOptions *imageOptions = [PHImageRequestOptions new];

  // Allow PhotoKit to fetch images from iCloud
  imageOptions.networkAccessAllowed = YES;

  if (progressHandler) {
    imageOptions.progressHandler = ^(double progress, NSError *error, BOOL *stop, NSDictionary<NSString *, id> *info) {
      static const double multiplier = 1e6;
      progressHandler(progress * multiplier, multiplier);
    };
  }

  // Note: PhotoKit defaults to a deliveryMode of PHImageRequestOptionsDeliveryModeOpportunistic
  // which means it may call back multiple times - we probably don't want that
  imageOptions.deliveryMode = PHImageRequestOptionsDeliveryModeHighQualityFormat;

  BOOL useMaximumSize = CGSizeEqualToSize(size, CGSizeZero);
  CGSize targetSize;
  if (useMaximumSize) {
    targetSize = PHImageManagerMaximumSize;
    imageOptions.resizeMode = PHImageRequestOptionsResizeModeNone;
  } else {
    targetSize = CGSizeApplyAffineTransform(size, CGAffineTransformMakeScale(scale, scale));
    imageOptions.resizeMode = PHImageRequestOptionsResizeModeFast;
  }

  PHImageContentMode contentMode = PHImageContentModeAspectFill;
  if (resizeMode == RCTResizeModeContain) {
    contentMode = PHImageContentModeAspectFit;
  }

  PHImageRequestID requestID =
  [[PHImageManager defaultManager] requestImageForAsset:asset
                                             targetSize:targetSize
                                            contentMode:contentMode
                                                options:imageOptions
                                          resultHandler:^(UIImage *result, NSDictionary<NSString *, id> *info) {
    if (result) {
      completionHandler(nil, result);
    } else {
      completionHandler(info[PHImageErrorKey], nil);
    }
  }];

  return ^{
    [[PHImageManager defaultManager] cancelImageRequest:requestID];
  };
}

@end

#endif
