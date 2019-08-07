//
//  ABI31_0_0EXFaceDetector.m
//  Exponent
//
//  Created by Stanisław Chmiela on 13.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <ABI31_0_0EXFaceDetector/ABI31_0_0EXFaceDetectorModule.h>
#import <ABI31_0_0EXFaceDetector/ABI31_0_0EXFaceDetector.h>
#import <ABI31_0_0EXFileSystemInterface/ABI31_0_0EXFileSystemInterface.h>
#import <ABI31_0_0EXFaceDetector/ABI31_0_0EXFaceDetectorUtils.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistry.h>
#import <ABI31_0_0EXFaceDetector/ABI31_0_0EXFaceEncoder.h>
#import <ABI31_0_0EXFaceDetector/ABI31_0_0CSBufferOrientationCalculator.h>
#import <Firebase/Firebase.h>

@interface ABI31_0_0EXFaceDetectorModule ()

@property (nonatomic, weak) ABI31_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI31_0_0EXFaceDetectorModule

static NSFileManager *fileManager = nil;
static NSDictionary *defaultDetectorOptions = nil;

- (instancetype)initWithModuleRegistry:(ABI31_0_0EXModuleRegistry *)moduleRegistry
{
  self = [super init];
  if (self) {
    _moduleRegistry = moduleRegistry;
    fileManager = [NSFileManager defaultManager];
  }
  return self;
}

ABI31_0_0EX_EXPORT_MODULE(ExpoFaceDetector);

- (NSDictionary *)constantsToExport
{
  return [ABI31_0_0EXFaceDetectorUtils constantsToExport];
}

- (void)setModuleRegistry:(ABI31_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI31_0_0EX_EXPORT_METHOD_AS(detectFaces, detectFaces:(nonnull NSDictionary *)options resolver:(ABI31_0_0EXPromiseResolveBlock)resolve rejecter:(ABI31_0_0EXPromiseRejectBlock)reject)
{
  NSString *uri = options[@"uri"];
  if (uri == nil) {
    reject(@"E_FACE_DETECTION_FAILED", @"You must define a URI.", nil);
    return;
  }
  
  NSURL *url = [NSURL URLWithString:uri];
  NSString *path = [url.path stringByStandardizingPath];
  
  NSException *exception;
  id<ABI31_0_0EXFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI31_0_0EXFileSystemInterface)];
  if (!fileSystem || exception) {
    reject(@"E_MODULE_UNAVAILABLE", @"No file system module", nil);
    return;
  }
  
  if (!([fileSystem permissionsForURI:url] & ABI31_0_0EXFileSystemPermissionRead)) {
    reject(@"E_FILESYSTEM_PERMISSIONS", [NSString stringWithFormat:@"File '%@' isn't readable.", uri], nil);
    return;
  }
  
  @try {
    UIImage *image = [[UIImage alloc] initWithContentsOfFile:path];
    CIImage *ciImage = image.CIImage;
    if(!ciImage) {
      ciImage = [CIImage imageWithCGImage:image.CGImage];
    }
    ciImage = [ciImage imageByApplyingOrientation:[ABI31_0_0EXFaceDetectorUtils toCGImageOrientation:image.imageOrientation]];
    CIContext *context = [CIContext contextWithOptions:@{}];
    UIImage *temporaryImage = [UIImage imageWithCIImage:ciImage];
    CGRect tempImageRect = CGRectMake(0, 0, temporaryImage.size.width, temporaryImage.size.height);
    CGImageRef cgImage = [context createCGImage:ciImage fromRect:tempImageRect];
    
    UIImage *finalImage = [UIImage imageWithCGImage:cgImage];
    ABI31_0_0EXFaceDetector* detector = [[ABI31_0_0EXFaceDetector alloc] initWithOptions: [ABI31_0_0EXFaceDetectorUtils mapOptions:options]];
    [detector detectFromImage:finalImage completionListener:^(NSArray<FIRVisionFace *> * _Nullable faces, NSError * _Nullable error) {
      NSMutableArray<NSDictionary*>* reportableFaces = [NSMutableArray new];
      
      if(faces.count > 0) {
        ABI31_0_0EXFaceEncoder *encoder = [[ABI31_0_0EXFaceEncoder alloc] init];
        for(FIRVisionFace* face in faces)
      {
          [reportableFaces addObject:[encoder encode:face]];
        }
      }
      if (error != nil) {
        reject(@"E_FACE_DETECTION_FAILED", [exception description], nil);
      } else {
        resolve(@{
                  @"faces" : reportableFaces,
                  @"image" : @{
                      @"uri" : options[@"uri"],
                      @"width" : @(image.size.width),
                      @"height" : @(image.size.height),
                      @"orientation" : @([ABI31_0_0EXFaceDetectorModule exifOrientationFor:image.imageOrientation])
                      }
                  });
      }}];
  } @catch (NSException *exception) {
    reject(@"E_FACE_DETECTION_FAILED", [exception description], nil);
  }
}

# pragma mark: - Utility methods

// As the documentation (http://cocoadocs.org/docsets/GoogleMobileVision/1.0.2/Constants/GMVImageOrientation.html) suggests
// the value of GMVImageOrientation is the same as the value defined by ABI31_0_0EXIF specifications, so we can adapt
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
