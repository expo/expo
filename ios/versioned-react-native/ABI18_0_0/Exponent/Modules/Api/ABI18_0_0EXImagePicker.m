#import "ABI18_0_0EXImagePicker.h"

#import <ReactABI18_0_0/ABI18_0_0RCTConvert.h>
#import <ReactABI18_0_0/ABI18_0_0RCTUtils.h>
#import <AssetsLibrary/AssetsLibrary.h>

#import "ABI18_0_0EXScope.h"
#import "ABI18_0_0EXFileSystem.h"

@import MobileCoreServices;
@import Photos;

@interface ABI18_0_0EXImagePicker ()

@property (nonatomic, strong) UIAlertController *alertController;
@property (nonatomic, strong) UIImagePickerController *picker;
@property (nonatomic, strong) ABI18_0_0RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI18_0_0RCTPromiseRejectBlock reject;
@property (nonatomic, strong) NSDictionary *defaultOptions;
@property (nonatomic, retain) NSMutableDictionary *options;
@property (nonatomic, strong) NSDictionary *customButtons;

@end

@implementation ABI18_0_0EXImagePicker

ABI18_0_0RCT_EXPORT_MODULE(ExponentImagePicker);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI18_0_0RCTBridge *)bridge
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
      @"base64": @NO,
    };
  }
  return self;
}

ABI18_0_0RCT_EXPORT_METHOD(launchCameraAsync:(NSDictionary *)options
                  resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  self.resolve = resolve;
  self.reject = reject;
  [self launchImagePicker:ABI18_0_0RNImagePickerTargetCamera options:options];
}

ABI18_0_0RCT_EXPORT_METHOD(launchImageLibraryAsync:(NSDictionary *)options
                  resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  self.resolve = resolve;
  self.reject = reject;
  [self launchImagePicker:ABI18_0_0RNImagePickerTargetLibrarySingleImage options:options];
}

- (void)launchImagePicker:(ABI18_0_0RNImagePickerTarget)target options:(NSDictionary *)options
{
  self.options = [NSMutableDictionary dictionaryWithDictionary:self.defaultOptions]; // Set default options
  for (NSString *key in options.keyEnumerator) { // Replace default options
    [self.options setValue:options[key] forKey:key];
  }
  [self launchImagePicker:target];
}

- (void)launchImagePicker:(ABI18_0_0RNImagePickerTarget)target
{
  self.picker = [[UIImagePickerController alloc] init];

  if (target == ABI18_0_0RNImagePickerTargetCamera) {
#if TARGET_IPHONE_SIMULATOR
    self.reject(ABI18_0_0RCTErrorUnspecified, @"Camera not available on simulator", nil);
    return;
#else
    self.picker.sourceType = UIImagePickerControllerSourceTypeCamera;
    if ([[self.options objectForKey:@"cameraType"] isEqualToString:@"front"]) {
      self.picker.cameraDevice = UIImagePickerControllerCameraDeviceFront;
    } else { // "back"
      self.picker.cameraDevice = UIImagePickerControllerCameraDeviceRear;
    }
#endif
  } else { // ABI18_0_0RNImagePickerTargetLibrarySingleImage
    self.picker.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;
  }

  self.picker.mediaTypes = @[(NSString *)kUTTypeImage];

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
    ABI18_0_0RCTAssert([mediaType isEqualToString:(NSString *)kUTTypeImage], @"Expected image response from `UIImagePickerController`");

    UIImage *image;
    if ([[self.options objectForKey:@"allowsEditing"] boolValue]) {
      image = [info objectForKey:UIImagePickerControllerEditedImage];
    } else {
      image = [info objectForKey:UIImagePickerControllerOriginalImage];
    }
    image = [self fixOrientation:image];

    NSMutableDictionary *response = [[NSMutableDictionary alloc] init];

    // Write to a temporary file in the Expo File System
    NSData *data = UIImageJPEGRepresentation(image, [[self.options valueForKey:@"quality"] floatValue]);
    NSString *fileName = [[[NSUUID UUID] UUIDString] stringByAppendingString:@".jpg"];
    [ABI18_0_0EXFileSystem ensureDirExistsWithPath:[self.bridge.experienceScope scopedPathWithPath:@"ImagePicker"
                                                                              withOptions:@{@"cache": @YES}]];
    NSString *path = [self.bridge.experienceScope scopedPathWithPath:[@"ImagePicker" stringByAppendingPathComponent:fileName]
                                                         withOptions:@{@"cache": @YES}];
    [data writeToFile:path atomically:YES];
    NSURL *fileURL = [NSURL fileURLWithPath:path];
    NSString *filePath = [fileURL absoluteString];
    [response setObject:filePath forKey:@"uri"];

    [response setObject:@(image.size.width) forKey:@"width"];
    [response setObject:@(image.size.height) forKey:@"height"];

    if ([[self.options objectForKey:@"base64"] boolValue]) {
      [response setObject:[data base64EncodedStringWithOptions:0] forKey:@"base64"];
    }

    [response setObject:@NO forKey:@"cancelled"];

    if ([[self.options objectForKey:@"exif"] boolValue]) {
      // Can easily get metadata only if from camera, else go through `PHAsset`
      NSDictionary *metadata = [info objectForKey:UIImagePickerControllerMediaMetadata];
      if (metadata) {
        [self updateResponse:response withMetadata:metadata];
        self.resolve(response);
      } else {
        PHAsset *asset = [PHAsset fetchAssetsWithALAssetURLs:@[imageURL] options:nil].firstObject;
        PHContentEditingInputRequestOptions *options = [[PHContentEditingInputRequestOptions alloc] init];
        options.networkAccessAllowed = YES; // Download from iCloud if needed
        [asset requestContentEditingInputWithOptions:options completionHandler:^(PHContentEditingInput *input, NSDictionary *info) {
          NSDictionary *metadata = [CIImage imageWithContentsOfURL:input.fullSizeImageURL].properties;
          [self updateResponse:response withMetadata:metadata];
          self.resolve(response);
        }];
      }
    } else {
      self.resolve(response);
    }
  };
  dispatch_async(dispatch_get_main_queue(), ^{
    [picker dismissViewControllerAnimated:YES completion:dismissCompletionBlock];
  });
}

- (void)updateResponse:(NSMutableDictionary *)response withMetadata:(NSDictionary *)metadata
{
  NSMutableDictionary *exif = [NSMutableDictionary dictionaryWithDictionary:metadata[(NSString *)kCGImagePropertyExifDictionary]];

  // Copy `["{GPS}"]["<tag>"]` to `["GPS<tag>"]`
  NSDictionary *gps = metadata[(NSString *)kCGImagePropertyGPSDictionary];
  if (gps) {
    for (NSString *gpsKey in gps) {
      exif[[@"GPS" stringByAppendingString:gpsKey]] = gps[gpsKey];
    }
  }

  [response setObject:exif forKey:@"exif"];
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [picker dismissViewControllerAnimated:YES completion:^{
      self.resolve(@{@"cancelled": @YES});
    }];
  });
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
