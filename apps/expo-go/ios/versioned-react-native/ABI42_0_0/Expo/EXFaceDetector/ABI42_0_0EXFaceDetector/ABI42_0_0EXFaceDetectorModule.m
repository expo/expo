//
//  ABI42_0_0EXFaceDetector.m
//  Exponent
//
//  Created by Stanisław Chmiela on 13.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <ABI42_0_0EXFaceDetector/ABI42_0_0EXFaceDetectorModule.h>
#import <ABI42_0_0EXFaceDetector/ABI42_0_0EXFaceDetector.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFileSystemInterface.h>
#import <ABI42_0_0EXFaceDetector/ABI42_0_0EXFaceDetectorUtils.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistry.h>
#import <ABI42_0_0EXFaceDetector/ABI42_0_0EXFaceEncoder.h>
#import <ABI42_0_0EXFaceDetector/ABI42_0_0EXCSBufferOrientationCalculator.h>

@interface ABI42_0_0EXFaceDetectorModule ()

@property (nonatomic, weak) ABI42_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI42_0_0EXFaceDetectorModule

static NSFileManager *fileManager = nil;
static NSDictionary *defaultDetectorOptions = nil;

- (instancetype)initWithModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  self = [super init];
  if (self) {
    _moduleRegistry = moduleRegistry;
    fileManager = [NSFileManager defaultManager];
  }
  return self;
}

ABI42_0_0UM_EXPORT_MODULE(ExpoFaceDetector);

- (NSDictionary *)constantsToExport
{
  return [ABI42_0_0EXFaceDetectorUtils constantsToExport];
}

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI42_0_0UM_EXPORT_METHOD_AS(detectFaces, detectFaces:(nonnull NSDictionary *)options resolver:(ABI42_0_0UMPromiseResolveBlock)resolve rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  NSString *uri = options[@"uri"];
  if (uri == nil) {
    reject(@"E_FACE_DETECTION_FAILED", @"You must define a URI.", nil);
    return;
  }

  NSURL *url = [NSURL URLWithString:uri];
  NSString *path = [url.path stringByStandardizingPath];

  NSException *exception;
  id<ABI42_0_0EXFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXFileSystemInterface)];
  if (!fileSystem || exception) {
    reject(@"E_MODULE_UNAVAILABLE", @"No file system module", nil);
    return;
  }

  if (!([fileSystem permissionsForURI:url] & ABI42_0_0EXFileSystemPermissionRead)) {
    reject(@"E_FILESYSTEM_PERMISSIONS", [NSString stringWithFormat:@"File '%@' isn't readable.", uri], nil);
    return;
  }

  @try {
    UIImage *image = [[UIImage alloc] initWithContentsOfFile:path];
    CIImage *ciImage = image.CIImage;
    if(!ciImage) {
      ciImage = [CIImage imageWithCGImage:image.CGImage];
    }
    ciImage = [ciImage imageByApplyingOrientation:[ABI42_0_0EXFaceDetectorUtils toCGImageOrientation:image.imageOrientation]];
    CIContext *context = [CIContext contextWithOptions:@{}];
    UIImage *temporaryImage = [UIImage imageWithCIImage:ciImage];
    CGRect tempImageRect = CGRectMake(0, 0, temporaryImage.size.width, temporaryImage.size.height);
    CGImageRef cgImage = [context createCGImage:ciImage fromRect:tempImageRect];

    UIImage *finalImage = [UIImage imageWithCGImage:cgImage];
    ABI42_0_0EXFaceDetector* detector = [[ABI42_0_0EXFaceDetector alloc] initWithOptions: [ABI42_0_0EXFaceDetectorUtils mapOptions:options]];
    [detector detectFromImage:finalImage completionListener:^(NSArray<MLKFace *> * _Nullable faces, NSError * _Nullable error) {
      NSMutableArray<NSDictionary*>* reportableFaces = [NSMutableArray new];

      if(faces.count > 0) {
        ABI42_0_0EXFaceEncoder *encoder = [[ABI42_0_0EXFaceEncoder alloc] init];
        for(MLKFace* face in faces)
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
                      @"orientation" : @([ABI42_0_0EXFaceDetectorModule exifOrientationFor:image.imageOrientation])
                      }
                  });
      }}];
  } @catch (NSException *exception) {
    reject(@"E_FACE_DETECTION_FAILED", [exception description], nil);
  }
}

# pragma mark: - Utility methods

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
