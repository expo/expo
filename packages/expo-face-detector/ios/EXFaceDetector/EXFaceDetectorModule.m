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
#import <EXFaceDetector/EXFaceEncoder.h>
#import <EXFaceDetector/EXCSBufferOrientationCalculator.h>
#import <Firebase/Firebase.h>

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

UM_EXPORT_METHOD_AS(detectFaces, detectFaces:(nonnull NSDictionary *)options resolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  if (![FIRApp defaultApp]) {
    reject(@"E_FACE_DETECTION_FAILED", @"Firebase is not configured", nil);
    return;
  }
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
    UIImage *image = [[UIImage alloc] initWithContentsOfFile:path];
    CIImage *ciImage = image.CIImage;
    if(!ciImage) {
      ciImage = [CIImage imageWithCGImage:image.CGImage];
    }
    ciImage = [ciImage imageByApplyingOrientation:[EXFaceDetectorUtils toCGImageOrientation:image.imageOrientation]];
    CIContext *context = [CIContext contextWithOptions:@{}];
    UIImage *temporaryImage = [UIImage imageWithCIImage:ciImage];
    CGRect tempImageRect = CGRectMake(0, 0, temporaryImage.size.width, temporaryImage.size.height);
    CGImageRef cgImage = [context createCGImage:ciImage fromRect:tempImageRect];
    
    UIImage *finalImage = [UIImage imageWithCGImage:cgImage];
    EXFaceDetector* detector = [[EXFaceDetector alloc] initWithOptions: [EXFaceDetectorUtils mapOptions:options]];
    [detector detectFromImage:finalImage completionListener:^(NSArray<FIRVisionFace *> * _Nullable faces, NSError * _Nullable error) {
      NSMutableArray<NSDictionary*>* reportableFaces = [NSMutableArray new];
      
      if(faces.count > 0) {
        EXFaceEncoder *encoder = [[EXFaceEncoder alloc] init];
        for(FIRVisionFace* face in faces)
      {
          [reportableFaces addObject:[encoder encode:face]];
        }
      }

      CGImageRelease(cgImage);
      if (error != nil) {
        reject(@"E_FACE_DETECTION_FAILED", [exception description], nil);
      } else {
        resolve(@{
                  @"faces" : reportableFaces,
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

# pragma mark: - Utility methods

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
