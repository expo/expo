//
//  ABI48_0_0EXFaceDetector.m
//  ABI48_0_0EXFaceDetector
//
//  Created by Michał Czernek on 12/04/2019.
//

#import <ABI48_0_0EXFaceDetector/ABI48_0_0EXFaceDetector.h>
#import <MLKitFaceDetection/MLKitFaceDetection.h>

@implementation ABI48_0_0EXFaceDetector
{
  MLKFaceDetector *detector;
}

- (instancetype)initWithOptions:(MLKFaceDetectorOptions *)options
{
  self = [super init];
  detector = [ABI48_0_0EXFaceDetector detectorForOptions:options];
  return self;
}

- (void)detectFromImage:(UIImage*)image
     completionListener:(void(^)(NSArray<MLKFace *> * _Nullable faces, NSError* error)) completion
{
  if(image) {
    if(image.CGImage) {
      MLKVisionImage *visionImage = [[MLKVisionImage alloc] initWithImage:image];
      [self detectFromMLKImage:visionImage completionListener:completion];
    } else {
      completion(nil, [NSError errorWithDomain:@"faceDetector" code:0 userInfo:@{
                                                                                 @"error": @"Image's CGImage must not be nil!"
                                                                                 }]);
    }
  } else {
    completion(nil, [NSError errorWithDomain:@"faceDetector" code:0 userInfo:@{
                                                                               @"error": @"Image must not be nil!"
                                                                               }]);
  }
}

- (void)detectFromBuffer:(CMSampleBufferRef)buffer
            orientation:(UIImageOrientation)orientation
     completionListener:(void(^)(NSArray<MLKFace *> * _Nullable faces, NSError *error))completion
{
  if (buffer != nil) {
    MLKVisionImage *visionImage = [[MLKVisionImage alloc] initWithBuffer:buffer];
    visionImage.orientation = orientation;
    [self detectFromMLKImage:visionImage completionListener:completion];
  } else {
    completion(nil, [NSError errorWithDomain:@"faceDetector"
                                        code:0
                                    userInfo:@{ @"error": @"Image must not be nil!" }]);
  }
}

- (void)detectFromMLKImage:(MLKVisionImage *)image
       completionListener:(void(^)(NSArray<MLKFace *> * _Nullable faces, NSError *error))completion
{
  if(image != nil) {
    [detector processImage:image
                completion:^(NSArray<MLKFace *> *faces,
                             NSError *error) {
                  if (error != nil) {
                    completion(nil, error);
                  } else if (faces != nil) {
                    NSMutableArray<MLKFace *> *encodedFaces = [NSMutableArray arrayWithCapacity:[faces count]];
                    [faces enumerateObjectsUsingBlock:^(MLKFace * _Nonnull face, NSUInteger idx, BOOL * _Nonnull stop) {
                      [encodedFaces addObject:face];
                    }];
                    completion(encodedFaces, nil);
                  }
                }];
  } else {
    completion(nil, [NSError errorWithDomain:@"faceDetector" code:0 userInfo:@{
                                                                               @"error": @"Image is nil!"
                                                                               }]);
  }
}

+ (MLKFaceDetector *)detectorForOptions:(MLKFaceDetectorOptions *)options
{
  return [MLKFaceDetector faceDetectorWithOptions:options];
}
@end
