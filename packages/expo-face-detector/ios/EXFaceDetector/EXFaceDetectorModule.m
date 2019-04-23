//
//  EXFaceDetector.m
//  Exponent
//
//  Created by Stanisław Chmiela on 13.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <EXFaceDetector/EXFaceDetectorModule.h>
#import <EXFaceDetector/EXFaceDetector.h>
#import <UMFileSystemInterface/UMFileSystemInterface.h>
#import <EXFaceDetector/EXFaceDetectorUtils.h>
#import <UMCore/UMModuleRegistry.h>
#import "Firebase.h"

@interface EXFaceDetectorModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXFaceDetectorModule

static NSFileManager *fileManager = nil;
static NSDictionary *defaultDetectorOptions = nil;

- (instancetype)initWithModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  self = [super init];
  if (self) {
    _moduleRegistry = moduleRegistry;
    fileManager = [NSFileManager defaultManager];
  }
  [FIRApp configure];
  return self;
}

UM_EXPORT_MODULE(ExpoFaceDetector);

- (NSDictionary *)constantsToExport
{
  return [EXFaceDetectorUtils constantsToExport];
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

UM_EXPORT_METHOD_AS(detectFaces, detectFaces:(nonnull NSDictionary *)options resolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject) {
  NSString *uri = options[@"uri"];
  if (uri == nil) {
    reject(@"E_FACE_DETECTION_FAILED", @"You must define a URI.", nil);
    return;
  }
  
  NSURL *url = [NSURL URLWithString:uri];
  NSString *path = [url.path stringByStandardizingPath];
  
  NSException *exception;
  id<UMFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(UMFileSystemInterface)];
  if (!fileSystem || exception) {
    reject(@"E_MODULE_UNAVAILABLE", @"No file system module", nil);
    return;
  }
  
  if (!([fileSystem permissionsForURI:url] & UMFileSystemPermissionRead)) {
    reject(@"E_FILESYSTEM_PERMISSIONS", [NSString stringWithFormat:@"File '%@' isn't readable.", uri], nil);
    return;
  }
  
  @try {
    
    // This check was failing, probably because of some race condition
    // see note at https://developer.apple.com/documentation/foundation/nsfilemanager/1415645-fileexistsatpath?language=objc
    //    if (![fileManager fileExistsAtPath:path]) {
    //      reject(@"E_FACE_DETECTION_FAILED", [NSString stringWithFormat:@"The file does not exist. Given path: `%@`.", path], nil);
    //      return;
    //    }
    
    UIImage *image = [[UIImage alloc] initWithContentsOfFile:path];
    
    NSDictionary *detectionOptions = [[self class] detectionOptionsForImage:image];
    
    EXFaceDetector* detector = [[EXFaceDetector alloc] initWithOptions: [EXFaceDetectorUtils mapOptions:detectionOptions]];
    [detector detectFromImage:image completionListener:^(NSArray<NSDictionary *> * _Nonnull faces, NSError * _Nonnull error) {
      if (error != nil) {
        reject(@"E_FACE_DETECTION_FAILED", [exception description], nil);
      } else if (faces != nil) {
        resolve(@{
                  @"faces" : faces,
                  @"image" : @{
                      @"uri" : options[@"uri"],
                      @"width" : @(image.size.width),
                      @"height" : @(image.size.height),
                      @"orientation" : @([EXFaceDetectorModule exifOrientationFor:image.imageOrientation])
                      }
                  });
      }}];
  } @catch (NSException *exception) {
    reject(@"E_FACE_DETECTION_FAILED", [exception description], nil);
  }
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
