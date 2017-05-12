#import "ABI17_0_0EXImagePicker.h"

#import <ReactABI17_0_0/ABI17_0_0RCTConvert.h>
#import <ReactABI17_0_0/ABI17_0_0RCTUtils.h>
#import <AssetsLibrary/AssetsLibrary.h>

#import "ABI17_0_0EXScope.h"
#import "ABI17_0_0EXFileSystem.h"

@import MobileCoreServices;

@interface ABI17_0_0EXImagePicker ()

@property (nonatomic, strong) UIAlertController *alertController;
@property (nonatomic, strong) UIImagePickerController *picker;
@property (nonatomic, strong) ABI17_0_0RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI17_0_0RCTPromiseRejectBlock reject;
@property (nonatomic, strong) NSDictionary *defaultOptions;
@property (nonatomic, retain) NSMutableDictionary *options;
@property (nonatomic, strong) NSDictionary *customButtons;

@end

@implementation ABI17_0_0EXImagePicker

ABI17_0_0RCT_EXPORT_MODULE(ExponentImagePicker);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI17_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (instancetype)init
{
  if (self = [super init]) {
    self.defaultOptions = @{
      @"title": @"Select a Photo",
      @"cancelButtonTitle": @"Cancel",
      @"takePhotoButtonTitle": @"Take Photo…",
      @"chooseFromLibraryButtonTitle": @"Choose from Library…",
      @"quality" : @0.2, // 1.0 best to 0.0 worst
      @"allowsEditing" : @NO,
      @"noData": @YES,
    };
  }
  return self;
}

ABI17_0_0RCT_EXPORT_METHOD(launchCameraAsync:(NSDictionary *)options
                  resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  self.resolve = resolve;
  self.reject = reject;
  [self launchImagePicker:ABI17_0_0RNImagePickerTargetCamera options:options];
}

ABI17_0_0RCT_EXPORT_METHOD(launchImageLibraryAsync:(NSDictionary *)options
                  resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  self.resolve = resolve;
  self.reject = reject;
  [self launchImagePicker:ABI17_0_0RNImagePickerTargetLibrarySingleImage options:options];
}

- (void)launchImagePicker:(ABI17_0_0RNImagePickerTarget)target options:(NSDictionary *)options
{
  self.options = [NSMutableDictionary dictionaryWithDictionary:self.defaultOptions]; // Set default options
  for (NSString *key in options.keyEnumerator) { // Replace default options
    [self.options setValue:options[key] forKey:key];
  }
  [self launchImagePicker:target];
}

- (void)launchImagePicker:(ABI17_0_0RNImagePickerTarget)target
{
  self.picker = [[UIImagePickerController alloc] init];

  if (target == ABI17_0_0RNImagePickerTargetCamera) {
#if TARGET_IPHONE_SIMULATOR
    self.reject(ABI17_0_0RCTErrorUnspecified, @"Camera not available on simulator", nil);
    return;
#else
    self.picker.sourceType = UIImagePickerControllerSourceTypeCamera;
    if ([[self.options objectForKey:@"cameraType"] isEqualToString:@"front"]) {
      self.picker.cameraDevice = UIImagePickerControllerCameraDeviceFront;
    } else { // "back"
      self.picker.cameraDevice = UIImagePickerControllerCameraDeviceRear;
    }
#endif
  } else { // ABI17_0_0RNImagePickerTargetLibrarySingleImage
    self.picker.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;
  }

  // TODO(nikki): Are we allowing video picking here? Unify into single media picking interface?
  if ([[self.options objectForKey:@"mediaType"] isEqualToString:@"video"]) {
    self.picker.mediaTypes = @[(NSString *)kUTTypeMovie];

    if ([[self.options objectForKey:@"videoQuality"] isEqualToString:@"high"]) {
      self.picker.videoQuality = UIImagePickerControllerQualityTypeHigh;
    } else if ([[self.options objectForKey:@"videoQuality"] isEqualToString:@"low"]) {
      self.picker.videoQuality = UIImagePickerControllerQualityTypeLow;
    } else {
      self.picker.videoQuality = UIImagePickerControllerQualityTypeMedium;
    }

    id durationLimit = [self.options objectForKey:@"durationLimit"];
    if (durationLimit) {
      self.picker.videoMaximumDuration = [durationLimit doubleValue];
    }
  } else {
    self.picker.mediaTypes = @[(NSString *)kUTTypeImage];
  }

  if ([[self.options objectForKey:@"allowsEditing"] boolValue]) {
    self.picker.allowsEditing = true;
  }
  self.picker.modalPresentationStyle = UIModalPresentationCurrentContext;
  self.picker.delegate = self;

  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController *root = [[[[UIApplication sharedApplication] delegate] window] rootViewController];
    while (root.presentedViewController != nil) {
      root = root.presentedViewController;
    }
    [root presentViewController:self.picker animated:YES completion:nil];
  });
}

- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary *)info
{
  dispatch_block_t dismissCompletionBlock = ^{
    NSURL *imageURL = [info valueForKey:UIImagePickerControllerReferenceURL];
    NSString *mediaType = [info objectForKey:UIImagePickerControllerMediaType];

    NSString *fileName;
    if ([mediaType isEqualToString:(NSString *)kUTTypeImage]) {
      NSString *tempFileName = [[NSUUID UUID] UUIDString];
      if (imageURL && [[imageURL absoluteString] rangeOfString:@"ext=GIF"].location != NSNotFound) {
        fileName = [tempFileName stringByAppendingString:@".gif"];
      } else if ([[[self.options objectForKey:@"imageFileType"] stringValue] isEqualToString:@"png"]) {
        fileName = [tempFileName stringByAppendingString:@".png"];
      } else {
        fileName = [tempFileName stringByAppendingString:@".jpg"];
      }
    } else {
      NSURL *videoURL = info[UIImagePickerControllerMediaURL];
      fileName = videoURL.lastPathComponent;
    }

    [ABI17_0_0EXFileSystem ensureDirExistsWithPath:[self.bridge.experienceScope scopedPathWithPath:@"ImagePicker"
                                                                              withOptions:@{@"cache": @YES}]];
    NSString *path = [self.bridge.experienceScope scopedPathWithPath:[@"ImagePicker" stringByAppendingPathComponent:fileName]
                                                         withOptions:@{@"cache": @YES}];

    // Create the response object
    NSMutableDictionary *response = [[NSMutableDictionary alloc] init];

    if ([mediaType isEqualToString:(NSString *)kUTTypeImage]) { // PHOTOS
      UIImage *image;
      if ([[self.options objectForKey:@"allowsEditing"] boolValue]) {
        image = [info objectForKey:UIImagePickerControllerEditedImage];
      } else {
        image = [info objectForKey:UIImagePickerControllerOriginalImage];
      }

      // GIFs break when resized, so we handle them differently
      if (imageURL && [[imageURL absoluteString] rangeOfString:@"ext=GIF"].location != NSNotFound) {
        ALAssetsLibrary* assetsLibrary = [[ALAssetsLibrary alloc] init];
        [assetsLibrary assetForURL:imageURL resultBlock:^(ALAsset *asset) {
          ALAssetRepresentation *rep = [asset defaultRepresentation];
          Byte *buffer = (Byte*)malloc((unsigned long)rep.size);
          NSUInteger buffered = [rep getBytes:buffer fromOffset:0.0 length:(unsigned long)rep.size error:nil];
          NSData *data = [NSData dataWithBytesNoCopy:buffer length:buffered freeWhenDone:YES];
          [data writeToFile:path atomically:YES];

          NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
          [response setObject:@(image.size.width) forKey:@"width"];
          [response setObject:@(image.size.height) forKey:@"height"];

          BOOL vertical = (image.size.width < image.size.height) ? YES : NO;
          [response setObject:@(vertical) forKey:@"isVertical"];

          if (![[self.options objectForKey:@"noData"] boolValue]) {
            NSString *dataString = [data base64EncodedStringWithOptions:0];
            [response setObject:dataString forKey:@"data"];
          }

          NSURL *fileURL = [NSURL fileURLWithPath:path];
          [response setObject:[fileURL absoluteString] forKey:@"uri"];

          NSNumber *fileSizeValue = nil;
          NSError *fileSizeError = nil;
          [fileURL getResourceValue:&fileSizeValue forKey:NSURLFileSizeKey error:&fileSizeError];
          if (fileSizeValue){
            [response setObject:fileSizeValue forKey:@"fileSize"];
          }

          [response setObject:@NO forKey:@"cancelled"];
          self.resolve(response);
        } failureBlock:^(NSError *error) {
          self.reject(ABI17_0_0RCTErrorUnspecified, error.localizedFailureReason, error);
        }];
        return;
      }

      image = [self fixOrientation:image];  // Rotate the image for upload to web

      // If needed, downscale image
      float maxWidth = image.size.width;
      float maxHeight = image.size.height;
      if ([self.options valueForKey:@"maxWidth"]) {
        maxWidth = [[self.options valueForKey:@"maxWidth"] floatValue];
      }
      if ([self.options valueForKey:@"maxHeight"]) {
        maxHeight = [[self.options valueForKey:@"maxHeight"] floatValue];
      }
      image = [self downscaleImageIfNecessary:image maxWidth:maxWidth maxHeight:maxHeight];

      NSData *data;
      if ([[[self.options objectForKey:@"imageFileType"] stringValue] isEqualToString:@"png"]) {
        data = UIImagePNGRepresentation(image);
      } else {
        data = UIImageJPEGRepresentation(image, [[self.options valueForKey:@"quality"] floatValue]);
      }
      [data writeToFile:path atomically:YES];

      if (![[self.options objectForKey:@"noData"] boolValue]) {
        NSString *dataString = [data base64EncodedStringWithOptions:0]; // base64 encoded image string
        [response setObject:dataString forKey:@"data"];
      }

      BOOL vertical = (image.size.width < image.size.height) ? YES : NO;
      [response setObject:@(vertical) forKey:@"isVertical"];
      NSURL *fileURL = [NSURL fileURLWithPath:path];
      NSString *filePath = [fileURL absoluteString];
      [response setObject:filePath forKey:@"uri"];

      // add ref to the original image
      NSString *origURL = [imageURL absoluteString];
      if (origURL) {
        [response setObject:origURL forKey:@"origURL"];
      }

      NSNumber *fileSizeValue = nil;
      NSError *fileSizeError = nil;
      [fileURL getResourceValue:&fileSizeValue forKey:NSURLFileSizeKey error:&fileSizeError];
      if (fileSizeValue){
        [response setObject:fileSizeValue forKey:@"fileSize"];
      }

      [response setObject:@(image.size.width) forKey:@"width"];
      [response setObject:@(image.size.height) forKey:@"height"];
    } else { // VIDEO
      NSURL *videoURL = info[UIImagePickerControllerMediaURL];
      NSURL *videoDestinationURL = [NSURL fileURLWithPath:path];

      // iOS automatically copies the selected video to the /tmp/ directory. So only move it if the user specified storageOptions

      if ([videoURL.URLByResolvingSymlinksInPath.path isEqualToString:videoDestinationURL.URLByResolvingSymlinksInPath.path] == NO) {
        NSFileManager *fileManager = [NSFileManager defaultManager];

        // Delete file if it already exists
        if ([fileManager fileExistsAtPath:videoDestinationURL.path]) {
          [fileManager removeItemAtURL:videoDestinationURL error:nil];
        }

        NSError *error = nil;
        [fileManager moveItemAtURL:videoURL toURL:videoDestinationURL error:&error];
        if (error) {
          self.reject(ABI17_0_0RCTErrorUnspecified, error.localizedFailureReason, error);
          return;
        }
      }
      [response setObject:videoDestinationURL.absoluteString forKey:@"uri"];
    }

    [response setObject:@NO forKey:@"cancelled"];
    self.resolve(response);
  };
  dispatch_async(dispatch_get_main_queue(), ^{
    [picker dismissViewControllerAnimated:YES completion:dismissCompletionBlock];
  });
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [picker dismissViewControllerAnimated:YES completion:^{
      self.resolve(@{@"cancelled": @YES});
    }];
  });
}

- (UIImage*)downscaleImageIfNecessary:(UIImage*)image maxWidth:(float)maxWidth maxHeight:(float)maxHeight
{
  UIImage* newImage = image;

  // Nothing to do here
  if (image.size.width <= maxWidth && image.size.height <= maxHeight) {
    return newImage;
  }

  CGSize scaledSize = CGSizeMake(image.size.width, image.size.height);
  if (maxWidth < scaledSize.width) {
    scaledSize = CGSizeMake(maxWidth, (maxWidth / scaledSize.width) * scaledSize.height);
  }
  if (maxHeight < scaledSize.height) {
    scaledSize = CGSizeMake((maxHeight / scaledSize.height) * scaledSize.width, maxHeight);
  }

  // If the pixels are floats, it causes a white line in iOS8 and probably other versions too
  scaledSize.width = (int)scaledSize.width;
  scaledSize.height = (int)scaledSize.height;

  UIGraphicsBeginImageContext(scaledSize); // this will resize
  [image drawInRect:CGRectMake(0, 0, scaledSize.width, scaledSize.height)];
  newImage = UIGraphicsGetImageFromCurrentImageContext();
  if (newImage == nil) {
    NSLog(@"could not scale image");
  }
  UIGraphicsEndImageContext();

  return newImage;
}

- (UIImage *)fixOrientation:(UIImage *)srcImg {
  if (srcImg.imageOrientation == UIImageOrientationUp) {
    return srcImg;
  }

  CGAffineTransform transform = CGAffineTransformIdentity;
  switch (srcImg.imageOrientation) {
    case UIImageOrientationDown:
    case UIImageOrientationDownMirrored:
      transform = CGAffineTransformTranslate(transform, srcImg.size.width, srcImg.size.height);
      transform = CGAffineTransformRotate(transform, M_PI);
      break;

    case UIImageOrientationLeft:
    case UIImageOrientationLeftMirrored:
      transform = CGAffineTransformTranslate(transform, srcImg.size.width, 0);
      transform = CGAffineTransformRotate(transform, M_PI_2);
      break;

    case UIImageOrientationRight:
    case UIImageOrientationRightMirrored:
      transform = CGAffineTransformTranslate(transform, 0, srcImg.size.height);
      transform = CGAffineTransformRotate(transform, -M_PI_2);
      break;
    case UIImageOrientationUp:
    case UIImageOrientationUpMirrored:
      break;
  }

  switch (srcImg.imageOrientation) {
    case UIImageOrientationUpMirrored:
    case UIImageOrientationDownMirrored:
      transform = CGAffineTransformTranslate(transform, srcImg.size.width, 0);
      transform = CGAffineTransformScale(transform, -1, 1);
      break;

    case UIImageOrientationLeftMirrored:
    case UIImageOrientationRightMirrored:
      transform = CGAffineTransformTranslate(transform, srcImg.size.height, 0);
      transform = CGAffineTransformScale(transform, -1, 1);
      break;
    case UIImageOrientationUp:
    case UIImageOrientationDown:
    case UIImageOrientationLeft:
    case UIImageOrientationRight:
      break;
  }

  CGContextRef ctx = CGBitmapContextCreate(NULL, srcImg.size.width, srcImg.size.height, CGImageGetBitsPerComponent(srcImg.CGImage), 0, CGImageGetColorSpace(srcImg.CGImage), CGImageGetBitmapInfo(srcImg.CGImage));
  CGContextConcatCTM(ctx, transform);
  switch (srcImg.imageOrientation) {
    case UIImageOrientationLeft:
    case UIImageOrientationLeftMirrored:
    case UIImageOrientationRight:
    case UIImageOrientationRightMirrored:
      CGContextDrawImage(ctx, CGRectMake(0,0,srcImg.size.height,srcImg.size.width), srcImg.CGImage);
      break;

    default:
      CGContextDrawImage(ctx, CGRectMake(0,0,srcImg.size.width,srcImg.size.height), srcImg.CGImage);
      break;
  }

  CGImageRef cgimg = CGBitmapContextCreateImage(ctx);
  UIImage *img = [UIImage imageWithCGImage:cgimg];
  CGContextRelease(ctx);
  CGImageRelease(cgimg);
  return img;
}

@end
