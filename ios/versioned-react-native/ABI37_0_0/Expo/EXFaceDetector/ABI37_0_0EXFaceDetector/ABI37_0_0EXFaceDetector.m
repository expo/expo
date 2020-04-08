//
//  ABI37_0_0EXFaceDetector.m
//  ABI37_0_0EXFaceDetector
//
//  Created by Michał Czernek on 12/04/2019.
//

#import <ABI37_0_0EXFaceDetector/ABI37_0_0EXFaceDetector.h>
#import <Firebase/Firebase.h>

@implementation ABI37_0_0EXFaceDetector
{
  FIRVisionFaceDetector *detector;
}

-(instancetype) initWithOptions:(FIRVisionFaceDetectorOptions *)options
{
  self = [super init];
  detector = [ABI37_0_0EXFaceDetector detectorForOptions:options];
  return self;
}

-(void) detectFromImage:(UIImage*)image completionListener:(void(^)(NSArray<FIRVisionFace *> * _Nullable faces, NSError* error)) completion
{
  if(image) {
    if(image.CGImage) {
      FIRVisionImage *visionImage = [[FIRVisionImage alloc] initWithImage:image];
      [self detectFromFIRImage:visionImage completionListener:completion];
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

-(void) detectFromBuffer:(CMSampleBufferRef)buffer metadata:(FIRVisionImageMetadata *)metadata completionListener:(void(^)(NSArray<FIRVisionFace *> * _Nullable faces, NSError *error))completion
{
  if(buffer != nil) {
    FIRVisionImage *visionImage = [[FIRVisionImage alloc] initWithBuffer:buffer];
    visionImage.metadata = metadata;
    [self detectFromFIRImage:visionImage completionListener:completion];
  } else {
    completion(nil, [NSError errorWithDomain:@"faceDetector" code:0 userInfo:@{
                                                                               @"error": @"Image must not be nil!"
                                                                               }]);
  }
}

-(void) detectFromFIRImage:(FIRVisionImage *)image completionListener:(void(^)(NSArray<FIRVisionFace *> * _Nullable faces, NSError *error))completion
{
  if(image != nil) {
    [detector processImage:image
                completion:^(NSArray<FIRVisionFace *> *faces,
                             NSError *error) {
                  if (error != nil) {
                    completion(nil, error);
                  } else if (faces != nil) {
                    NSMutableArray<FIRVisionFace *> *encodedFaces = [NSMutableArray arrayWithCapacity:[faces count]];
                    [faces enumerateObjectsUsingBlock:^(FIRVisionFace * _Nonnull face, NSUInteger idx, BOOL * _Nonnull stop) {
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

+ (FIRVisionFaceDetector *)detectorForOptions:(FIRVisionFaceDetectorOptions *)options
{
  return [[FIRVision vision] faceDetectorWithOptions:options];
}
@end
