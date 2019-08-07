// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXImageManipulator/EXImageManipulatorModule.h>
#import <UMFileSystemInterface/UMFileSystemInterface.h>
#import <UMImageLoaderInterface/UMImageLoaderInterface.h>
#import <Photos/Photos.h>

@interface EXImageManipulatorModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<UMFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<UMImageLoaderInterface> imageLoader;

@end

static NSString* const ACTION_KEY_RESIZE = @"resize";
static NSString* const ACTION_KEY_ROTATE = @"rotate";
static NSString* const ACTION_KEY_FLIP = @"flip";
static NSString* const ACTION_KEY_CROP = @"crop";

static NSString* const SAVE_OPTIONS_KEY_FORMAT = @"format";
static NSString* const SAVE_OPTIONS_KEY_COMPRESS = @"compress";
static NSString* const SAVE_OPTIONS_KEY_BASE64 = @"base64";

@implementation EXImageManipulatorModule

UM_EXPORT_MODULE(ExpoImageManipulator);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(UMFileSystemInterface)];
  _imageLoader = [moduleRegistry getModuleImplementingProtocol:@protocol(UMImageLoaderInterface)];
}

UM_EXPORT_METHOD_AS(manipulateAsync,
                    uri:(NSString *)uri
                    actions:(NSArray *)actions
                    saveOptions:(NSDictionary *)saveOptions
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  NSURL *url = [NSURL URLWithString:uri];
  NSString *path = [url.path stringByStandardizingPath];

  if (!_fileSystem) {
    return reject(@"E_MISSING_MODULE", @"No FileSystem module.", nil);
  }
  if (!([_fileSystem permissionsForURI:url] & UMFileSystemPermissionRead)) {
    return reject(@"E_FILESYSTEM_PERMISSIONS", [NSString stringWithFormat:@"File '%@' isn't readable.", uri], nil);
  }
  
  NSString *errorMessage;
  if (![self areActionsValid:actions errorMessage:&errorMessage] || ![self areSaveOptionsValid:saveOptions errorMessage:&errorMessage]) {
    return reject(@"E_IMAGE_MANIPULATOR_INVALID_ARG", errorMessage, nil);
  }
  
  if ([[url scheme] isEqualToString:@"assets-library"]) {
    PHFetchResult<PHAsset *> *fetchResult = [PHAsset fetchAssetsWithALAssetURLs:@[url] options:nil];
    if (fetchResult.count > 0) {
      PHAsset *asset = fetchResult[0];
      CGSize size = CGSizeMake([asset pixelWidth], [asset pixelHeight]);
      PHImageRequestOptions *options = [PHImageRequestOptions new];
      [options setResizeMode:PHImageRequestOptionsResizeModeExact];
      [options setNetworkAccessAllowed:YES];
      [options setSynchronous:NO];
      [options setDeliveryMode:PHImageRequestOptionsDeliveryModeHighQualityFormat];
      
      [[PHImageManager defaultManager] requestImageForAsset:asset targetSize:size contentMode:PHImageContentModeAspectFit options:options resultHandler:^(UIImage * _Nullable image, NSDictionary * _Nullable info) {
        if (!image) {
          reject(@"E_IMAGE_MANIPULATION_FAILED", [NSString stringWithFormat:@"The file isn't convertable to image. Given path: `%@`.", path], nil);
          return;
        }
        image = [self fixOrientation:image];
        [self manipulateImage:image actions:actions saveOptions:saveOptions resolver:resolve rejecter:reject];
      }];
      return;
    } else {
      return reject(@"E_IMAGE_MANIPULATION_FAILED", [NSString stringWithFormat:@"The file does not exist. Given path: `%@`.", path], nil);
    }
  } else {
    [_imageLoader loadImageForURL:url completionHandler:^(NSError *error, UIImage *loadedImage) {
      if (error != nil) {
        return reject(@"E_IMAGE_MANIPULATION_FAILED", @"Could not get the image", error);
      }
      
      UIImage *image = [self fixOrientation:loadedImage];
      [self manipulateImage:image actions:actions saveOptions:saveOptions resolver:resolve rejecter:reject];
    }];
  }
}

-(BOOL)areActionsValid:(NSArray *)actions errorMessage:(NSString **)errorMessage
{
  for (NSDictionary *action in actions) {
    int actionsCounter = 0;
    if (action[ACTION_KEY_RESIZE]) {
      actionsCounter += 1;
    }
    
    if (action[ACTION_KEY_ROTATE]) {
      actionsCounter += 1;
    }
    
    if (action[ACTION_KEY_FLIP]) {
      actionsCounter += 1;
    }
    
    if (action[ACTION_KEY_CROP]) {
      actionsCounter += 1;
      
      if (action[ACTION_KEY_CROP][@"originX"] == nil
          || action[ACTION_KEY_CROP][@"originY"] == nil
          || action[ACTION_KEY_CROP][@"width"] == nil
          || action[ACTION_KEY_CROP][@"height"] == nil
          ) {
        *errorMessage = @"Invalid crop options has been passed. Please make sure the object contains originX, originY, width and height.";
        return NO;
      }
      
    }
    
    if (actionsCounter != 1) {
      *errorMessage = [NSString stringWithFormat:@"Single action must contain exactly one transformation from list: ['%@', '%@', '%@', '%@']",
                       ACTION_KEY_RESIZE,
                       ACTION_KEY_ROTATE,
                       ACTION_KEY_FLIP,
                       ACTION_KEY_CROP];
      return NO;
    }
  }
  return YES;
}

-(BOOL)areSaveOptionsValid:(NSDictionary *)saveOptions errorMessage:(NSString **)errorMessage
{
  NSString* format = saveOptions[SAVE_OPTIONS_KEY_FORMAT];
  if (![format isEqualToString:@"jpeg"] && ![format isEqualToString:@"png"]) {
    *errorMessage = [NSString stringWithFormat:@"SaveOption 'format' must be one of ['png', 'jpeg']. Obtained '%@'.", format];
    return NO;
  }
  return YES;
}

-(UIImage *)fixOrientation:(UIImage *)image
{
  if (image.imageOrientation == UIImageOrientationUp) {
    return image;
  }
  
  CGAffineTransform transform = CGAffineTransformIdentity;
  switch (image.imageOrientation) {
    case UIImageOrientationDown:
    case UIImageOrientationDownMirrored:
      transform = CGAffineTransformTranslate(transform, image.size.width, image.size.height);
      transform = CGAffineTransformRotate(transform, M_PI);
      break;
      
    case UIImageOrientationLeft:
    case UIImageOrientationLeftMirrored:
      transform = CGAffineTransformTranslate(transform, image.size.width, 0);
      transform = CGAffineTransformRotate(transform, M_PI_2);
      break;
      
    case UIImageOrientationRight:
    case UIImageOrientationRightMirrored:
      transform = CGAffineTransformTranslate(transform, 0, image.size.height);
      transform = CGAffineTransformRotate(transform, -M_PI_2);
      break;
      
    default:
      break;
  }
  
  switch (image.imageOrientation) {
    case UIImageOrientationUpMirrored:
    case UIImageOrientationDownMirrored:
      transform = CGAffineTransformTranslate(transform, image.size.width, 0);
      transform = CGAffineTransformScale(transform, -1, 1);
      break;
      
    case UIImageOrientationLeftMirrored:
    case UIImageOrientationRightMirrored:
      transform = CGAffineTransformTranslate(transform, image.size.height, 0);
      transform = CGAffineTransformScale(transform, -1, 1);
      break;
      
    default:
      break;
  }
  
  CGContextRef ctx = CGBitmapContextCreate(NULL, image.size.width, image.size.height, CGImageGetBitsPerComponent(image.CGImage), 0, CGImageGetColorSpace(image.CGImage), CGImageGetBitmapInfo(image.CGImage));
  CGContextConcatCTM(ctx, transform);
  switch (image.imageOrientation) {
    case UIImageOrientationLeft:
    case UIImageOrientationLeftMirrored:
    case UIImageOrientationRight:
    case UIImageOrientationRightMirrored:
      CGContextDrawImage(ctx, CGRectMake(0, 0, image.size.height, image.size.width), image.CGImage);
      break;
      
    default:
      CGContextDrawImage(ctx, CGRectMake(0, 0, image.size.width, image.size.height), image.CGImage);
      break;
  }
  
  CGImageRef cgimg = CGBitmapContextCreateImage(ctx);
  UIImage *img = [UIImage imageWithCGImage:cgimg];
  CGContextRelease(ctx);
  CGImageRelease(cgimg);
  return img;
}

-(void)manipulateImage:(UIImage *)image
               actions:(NSArray *)actions
           saveOptions:(NSDictionary *)saveOptions
              resolver:(UMPromiseResolveBlock)resolve
              rejecter:(UMPromiseRejectBlock)reject
{
  for (NSDictionary *action in actions) {
    if (action[ACTION_KEY_RESIZE]) {
      image = [self resizeImage:image options:action[ACTION_KEY_RESIZE]];
    } else if (action[ACTION_KEY_ROTATE]) {
      image = [self rotateImage:image rotation:(NSNumber *)action[ACTION_KEY_ROTATE]];
    } else if (action[ACTION_KEY_FLIP]) {
      image = [self flipImage:image flipType:action[ACTION_KEY_FLIP]];
    } else if (action[ACTION_KEY_CROP]) {
      NSString *errorMessage;
      image = [self cropImage:image options:action[ACTION_KEY_CROP] didFailWithErrorMessage:&errorMessage];
      if (errorMessage != nil) {
        return reject(@"E_INVALID_CROP_DATA", errorMessage, nil);
      }
    }
  }
  
  float compressionValue = saveOptions[SAVE_OPTIONS_KEY_COMPRESS] != nil ? [(NSNumber *)saveOptions[SAVE_OPTIONS_KEY_COMPRESS] floatValue] : 1.0;
  
  NSString *format = saveOptions[SAVE_OPTIONS_KEY_FORMAT];
  NSData *imageData = nil;
  NSString *extension;
  if ([format isEqualToString:@"jpeg"]) {
    imageData = UIImageJPEGRepresentation(image, compressionValue);
    extension = @".jpg";
  } else if ([format isEqualToString:@"png"]) {
    imageData = UIImagePNGRepresentation(image);
    extension = @".png";
  }
  
  NSString *directory = [_fileSystem.cachesDirectory stringByAppendingPathComponent:@"ImageManipulator"];
  [_fileSystem ensureDirExistsWithPath:directory];
  NSString *fileName = [[[NSUUID UUID] UUIDString] stringByAppendingString:extension];
  NSString *newPath = [directory stringByAppendingPathComponent:fileName];
  [imageData writeToFile:newPath atomically:YES];
  NSURL *fileURL = [NSURL fileURLWithPath:newPath];
  NSString *filePath = [fileURL absoluteString];
  
  NSMutableDictionary *response = [NSMutableDictionary new];
  response[@"uri"] = filePath;
  response[@"width"] = @(CGImageGetWidth(image.CGImage));
  response[@"height"] = @(CGImageGetHeight(image.CGImage));
  if (saveOptions[SAVE_OPTIONS_KEY_BASE64] && [saveOptions[SAVE_OPTIONS_KEY_BASE64] boolValue]) {
    response[@"base64"] = [imageData base64EncodedStringWithOptions:0];
  }
  resolve(response);
}

- (UIImage *)resizeImage:(UIImage *)image options:(NSDictionary *)resize
{
  float imageWidth = image.size.width;
  float imageHeight = image.size.height;
  float imageRatio = imageWidth / imageHeight;
  
  NSInteger requestedWidth = 0;
  NSInteger requestedHeight = 0;
  
  if (resize[@"width"]) {
    requestedWidth = [(NSNumber *)resize[@"width"] integerValue];
    requestedHeight = requestedWidth / imageRatio;
  }
  if (resize[@"height"]) {
    requestedHeight = [(NSNumber *)resize[@"height"] integerValue];
    requestedWidth = requestedWidth == 0 ? imageRatio * requestedHeight : requestedWidth;
  }
  
  CGSize requestedSize = CGSizeMake(requestedWidth, requestedHeight);
  UIGraphicsBeginImageContextWithOptions(requestedSize, NO, 1.0);
  [image drawInRect:CGRectMake(0, 0, requestedWidth, requestedHeight)];
  image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();

  return image;
}

- (UIImage *)rotateImage:(UIImage *)image rotation:(NSNumber *)rotation
{
  float rads = [rotation integerValue] * M_PI / 180;
  CGSize size = image.size;
  UIView *rotatedViewBox = [[UIView alloc] initWithFrame:CGRectMake(0,0,size.width, size.height)];
  CGAffineTransform t = CGAffineTransformMakeRotation(rads);
  rotatedViewBox.transform = t;
  CGSize rotatedSize = rotatedViewBox.frame.size;
  
  UIGraphicsBeginImageContext(rotatedSize);
  CGContextRef bitmap = UIGraphicsGetCurrentContext();
  CGContextTranslateCTM(bitmap, rotatedSize.width/2, rotatedSize.height/2);
  CGContextRotateCTM(bitmap, rads);
  CGContextScaleCTM(bitmap, 1.0, -1.0);
  CGContextDrawImage(bitmap, CGRectMake(-size.width / 2, -size.height / 2, size.width, size.height), image.CGImage);
  
  image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return image;
}

- (UIImage *)flipImage:(UIImage *)image flipType:(NSString *)flip
{
  UIImageView *tempImageView = [[UIImageView alloc] initWithImage:image];
  UIGraphicsBeginImageContext(tempImageView.frame.size);
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGAffineTransform transform;

  if ([flip isEqualToString:@"vertical"]) {
    transform = CGAffineTransformMake(1, 0, 0, -1, 0, tempImageView.frame.size.height);
    CGContextConcatCTM(context, transform);
  } else if ([flip isEqualToString:@"horizontal"]) {
    transform = CGAffineTransformMake(-1, 0, 0, 1, tempImageView.frame.size.width, 0);
    CGContextConcatCTM(context, transform);
  }
  
  [tempImageView.layer renderInContext:context];
  image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return image;
}

- (UIImage *)cropImage:(UIImage *)image options:(NSDictionary *)cropData didFailWithErrorMessage:(NSString **)errorMessage
{
  float originX = [(NSNumber *)cropData[@"originX"] floatValue];
  float originY = [(NSNumber *)cropData[@"originY"] floatValue];
  float requestedWidth = [(NSNumber *)cropData[@"width"] floatValue];
  float requestedHeight = [(NSNumber *)cropData[@"height"] floatValue];
  
  if (originX > image.size.width
      || originY > image.size.height
      || requestedWidth > image.size.width
      || requestedHeight > image.size.height
  ) {
    *errorMessage = @"Invalid crop options has been passed. Please make sure the requested crop rectangle is inside source image.";
    return nil;
  }
  CGRect cropDimensions = CGRectMake(originX, originY, requestedWidth, requestedHeight);
  CGImageRef takenCGImage = image.CGImage;
  CGImageRef cropCGImage = CGImageCreateWithImageInRect(takenCGImage, cropDimensions);
  image = [UIImage imageWithCGImage:cropCGImage scale:image.scale orientation:image.imageOrientation];
  CGImageRelease(cropCGImage);
  return image;
}

@end
