//
//  ABI28_0_0EXFaceDetector.m
//  Exponent
//
//  Created by Stanisław Chmiela on 13.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import "ABI28_0_0EXFaceDetectorModule.h"
#import "ABI28_0_0EXFaceEncoder.h"
#import "ABI28_0_0EXFileSystem.h"
#import "ABI28_0_0EXFaceDetectorUtils.h"

static const NSString *kModeOptionName = @"mode";
static const NSString *kDetectLandmarksOptionName = @"detectLandmarks";
static const NSString *kRunClassificationsOptionName = @"runClassifications";

@implementation ABI28_0_0EXFaceDetectorModule

static NSFileManager *fileManager = nil;
static NSDictionary *defaultDetectorOptions = nil;

- (instancetype)init
{
  self = [super init];
  if (self) {
    fileManager = [NSFileManager defaultManager];
  }
  return self;
}

ABI28_0_0RCT_EXPORT_MODULE(ExpoFaceDetector);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI28_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSDictionary *)constantsToExport
{
  return [ABI28_0_0EXFaceDetectorUtils constantsToExport];
}

ABI28_0_0RCT_EXPORT_METHOD(detectFaces:(nonnull NSDictionary *)options
                     resolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                     rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject)
{
  NSString *uri = options[@"uri"];
  if (uri == nil) {
    reject(@"E_FACE_DETECTION_FAILED", @"You must define a URI.", nil);
    return;
  }
  
  NSURL *url = [NSURL URLWithString:uri];
  NSString *path = [url.path stringByStandardizingPath];
  if (!([self.bridge.scopedModules.fileSystem permissionsForURI:url] & ABI28_0_0EXFileSystemPermissionRead)) {
    reject(@"E_FILESYSTEM_PERMISSIONS", [NSString stringWithFormat:@"File '%@' isn't readable.", uri], nil);
    return;
  }
  
  @try {
    GMVDetector *detector = [[self class] detectorForOptions:options];

    if (![fileManager fileExistsAtPath:path]) {
      reject(@"E_FACE_DETECTION_FAILED", [NSString stringWithFormat:@"The file does not exist. Given path: `%@`.", path], nil);
      return;
    }

    UIImage *image = [[UIImage alloc] initWithContentsOfFile:path];

    NSDictionary *detectionOptions = [[self class] detectionOptionsForImage:image];
    NSArray<GMVFaceFeature *> *faces = [detector featuresInImage:image options:detectionOptions];
    ABI28_0_0EXFaceEncoder *faceEncoder = [[ABI28_0_0EXFaceEncoder alloc] init];
    NSMutableArray<NSDictionary *> *encodedFaces = [NSMutableArray arrayWithCapacity:[faces count]];
    [faces enumerateObjectsUsingBlock:^(GMVFaceFeature * _Nonnull face, NSUInteger _idx, BOOL * _Nonnull _stop) {
      [encodedFaces addObject:[faceEncoder encode:face]];
    }];
    
    resolve(@{
              @"faces" : encodedFaces,
              @"image" : @{
                  @"uri" : options[@"uri"],
                  @"width" : @(image.size.width),
                  @"height" : @(image.size.height),
                  @"orientation" : @([ABI28_0_0EXFaceDetectorModule exifOrientationFor:image.imageOrientation])
                  }
              });
  } @catch (NSException *exception) {
    reject(@"E_FACE_DETECTION_FAILED", [exception description], nil);
  }
}

+ (GMVDetector *)detectorForOptions:(NSDictionary *)options
{
  NSMutableDictionary *parsedOptions = [[NSMutableDictionary alloc] initWithDictionary:[self getDefaultDetectorOptions]];
  
  if (options[kDetectLandmarksOptionName]) {
    [parsedOptions setObject:options[kDetectLandmarksOptionName] forKey:GMVDetectorFaceLandmarkType];
  }
  
  if (options[kModeOptionName]) {
    [parsedOptions setObject:options[kModeOptionName] forKey:GMVDetectorFaceMode];
  }
  
  if (options[kRunClassificationsOptionName]) {
    [parsedOptions setObject:options[kRunClassificationsOptionName] forKey:GMVDetectorFaceClassificationType];
  }

  return [GMVDetector detectorOfType:GMVDetectorTypeFace options:parsedOptions];
}

# pragma mark: - Detector default options getter and initializer

+ (NSDictionary *)getDefaultDetectorOptions
{
  if (defaultDetectorOptions == nil) {
    [self initDefaultDetectorOptions];
  }
  
  return defaultDetectorOptions;
}

+ (void)initDefaultDetectorOptions
{
  defaultDetectorOptions = @{
                             GMVDetectorFaceMode : @(GMVDetectorFaceAccurateMode),
                             GMVDetectorFaceLandmarkType : @(GMVDetectorFaceLandmarkAll),
                             GMVDetectorFaceClassificationType : @(GMVDetectorFaceClassificationAll)
                             };
}

# pragma mark: - Utility methods

+ (NSDictionary *)detectionOptionsForImage:(UIImage *)image
{
  return @{
           GMVDetectorImageOrientation : @([[self class] gmvImageOrientationFor:image.imageOrientation]),
           };
}

// As the documentation (http://cocoadocs.org/docsets/GoogleMobileVision/1.0.2/Constants/GMVImageOrientation.html) suggests
// the value of GMVImageOrientation is the same as the value defined by ABI28_0_0EXIF specifications, so we can adapt
// https://gist.github.com/steipete/4666527 to our needs.
+ (GMVImageOrientation)gmvImageOrientationFor:(UIImageOrientation)orientation
{
  switch (orientation) {
    case UIImageOrientationUp:
      return GMVImageOrientationTopLeft;
    case UIImageOrientationDown:
      return GMVImageOrientationBottomRight;
    case UIImageOrientationLeft:
      return GMVImageOrientationLeftBottom;
    case UIImageOrientationRight:
      return GMVImageOrientationRightTop;
    case UIImageOrientationUpMirrored:
      return GMVImageOrientationTopRight;
    case UIImageOrientationDownMirrored:
      return GMVImageOrientationBottomLeft;
    case UIImageOrientationLeftMirrored:
      return GMVImageOrientationLeftTop;
    case UIImageOrientationRightMirrored:
      return GMVImageOrientationRightBottom;
  }
}

// https://gist.github.com/steipete/4666527
+ (int)exifOrientationFor:(UIImageOrientation)orientation
{
  switch (orientation) {
    case UIImageOrientationUp:
      return 1;
    case UIImageOrientationDown:
      return 3;
    case UIImageOrientationLeft:
      return 8;
    case UIImageOrientationRight:
      return 6;
    case UIImageOrientationUpMirrored:
      return 2;
    case UIImageOrientationDownMirrored:
      return 4;
    case UIImageOrientationLeftMirrored:
      return 5;
    case UIImageOrientationRightMirrored:
      return 7;
  }
}

@end
