//
//  EXFaceDetector.m
//  Exponent
//
//  Created by Stanisław Chmiela on 13.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <EXFaceDetector/EXFaceDetectorModule.h>
#import <EXFaceDetector/EXFaceEncoder.h>
#import <EXFileSystemInterface/EXFileSystemInterface.h>
#import <EXFaceDetector/EXFaceDetectorUtils.h>
#import <EXCore/EXModuleRegistry.h>

static const NSString *kModeOptionName = @"mode";
static const NSString *kDetectLandmarksOptionName = @"detectLandmarks";
static const NSString *kRunClassificationsOptionName = @"runClassifications";

@interface EXFaceDetectorModule ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXFaceDetectorModule

static NSFileManager *fileManager = nil;
static NSDictionary *defaultDetectorOptions = nil;

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  self = [super init];
  if (self) {
    _moduleRegistry = moduleRegistry;
    fileManager = [NSFileManager defaultManager];
  }
  return self;
}

EX_EXPORT_MODULE(ExpoFaceDetector);

- (NSDictionary *)constantsToExport
{
  return [EXFaceDetectorUtils constantsToExport];
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

EX_EXPORT_METHOD_AS(detectFaces, detectFaces:(nonnull NSDictionary *)options resolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject) {
  NSString *uri = options[@"uri"];
  if (uri == nil) {
    reject(@"E_FACE_DETECTION_FAILED", @"You must define a URI.", nil);
    return;
  }
  
  NSURL *url = [NSURL URLWithString:uri];
  NSString *path = [url.path stringByStandardizingPath];
  
  NSException *exception;
  id<EXFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
  if (!fileSystem || exception) {
    reject(@"E_MODULE_UNAVAILABLE", @"No file system module", nil);
    return;
  }
  
  if (!([fileSystem permissionsForURI:url] & EXFileSystemPermissionRead)) {
    reject(@"E_FILESYSTEM_PERMISSIONS", [NSString stringWithFormat:@"File '%@' isn't readable.", uri], nil);
    return;
  }
  
  @try {
    GMVDetector *detector = [[self class] detectorForOptions:options];

    // This check was failing, probably because of some race condition
    // see note at https://developer.apple.com/documentation/foundation/nsfilemanager/1415645-fileexistsatpath?language=objc
//    if (![fileManager fileExistsAtPath:path]) {
//      reject(@"E_FACE_DETECTION_FAILED", [NSString stringWithFormat:@"The file does not exist. Given path: `%@`.", path], nil);
//      return;
//    }

    UIImage *image = [[UIImage alloc] initWithContentsOfFile:path];

    NSDictionary *detectionOptions = [[self class] detectionOptionsForImage:image];
    NSArray<GMVFaceFeature *> *faces = [detector featuresInImage:image options:detectionOptions];
    EXFaceEncoder *faceEncoder = [[EXFaceEncoder alloc] init];
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
                  @"orientation" : @([EXFaceDetectorModule exifOrientationFor:image.imageOrientation])
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
// the value of GMVImageOrientation is the same as the value defined by EXIF specifications, so we can adapt
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
