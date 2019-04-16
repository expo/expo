//
//  EXFaceDetector.m
//  EXFaceDetector
//
//  Created by Michał Czernek on 12/04/2019.
//

#import "EXFaceDetector.h"
#import "EXFaceEncoder.h"
#import "Firebase.h"

static const NSString *kModeOptionName = @"mode";
static const NSString *kDetectLandmarksOptionName = @"detectLandmarks";
static const NSString *kRunClassificationsOptionName = @"runClassifications";

@implementation EXFaceDetector

FIRVisionFaceDetector* detector;

-(instancetype) initWithOptions:(NSDictionary*)options {
  self = [super init];
  detector = [EXFaceDetector detectorForOptions:options];
  return self;
}

-(void) detectFromImage:(UIImage*)image facesTransform:(CGAffineTransform)transform completionListener:(void(^)(NSArray<NSDictionary *> *faces, NSError *error))completion {
  if(image != nil) {
    FIRVisionImage *visionImage = [[FIRVisionImage alloc] initWithImage:image];
    [self detectFromFIRImage:visionImage facesTransform:transform completionListener:completion];
  }
}

-(void) detectFromBuffer:(CMSampleBufferRef)buffer metadata:(FIRVisionImageMetadata*)metadata facesTransform:(CGAffineTransform)transform completionListener:(void(^)(NSArray<NSDictionary *> *faces, NSError *error))completion {
  if(buffer != nil) {
    FIRVisionImage *visionImage = [[FIRVisionImage alloc] initWithBuffer:buffer];
    visionImage.metadata = metadata;
    [self detectFromFIRImage:visionImage facesTransform:transform completionListener:completion];
  }
}

-(void) detectFromFIRImage:(FIRVisionImage*)image facesTransform:(CGAffineTransform)transform completionListener:(void(^)(NSArray<NSDictionary *> *faces, NSError *error))completion {
  if(image != nil) {
    [detector processImage:image
                completion:^(NSArray<FIRVisionFace *> *faces,
                             NSError *error) {
                  if (error != nil) {
                    completion(nil, error);
                  } else if (faces != nil) {
                    EXFaceEncoder *faceEncoder = [[EXFaceEncoder alloc] initWithTransform:transform];
                    NSMutableArray<NSDictionary *> *encodedFaces = [NSMutableArray arrayWithCapacity:[faces count]];
                    [faces enumerateObjectsUsingBlock:^(FIRVisionFace * _Nonnull face, NSUInteger idx, BOOL * _Nonnull stop) {
                      [encodedFaces addObject:[faceEncoder encode:face]];
                    }];
                    completion(encodedFaces, nil);
                  }
                }];
  }
}

+ (FIRVisionFaceDetector *)detectorForOptions:(NSDictionary *)options
{
  FIRVisionFaceDetectorOptions *faceDetectionOptions = [[FIRVisionFaceDetectorOptions alloc] init];
  
  if (options[kDetectLandmarksOptionName]) {
    faceDetectionOptions.landmarkMode = options[kDetectLandmarksOptionName];
  }
  
  if (options[kModeOptionName]) {
    faceDetectionOptions.performanceMode = options[kModeOptionName];
  }
  
  if (options[kRunClassificationsOptionName]) {
    faceDetectionOptions.classificationMode = options[kRunClassificationsOptionName];
  }
  return [[FIRVision vision] faceDetectorWithOptions:faceDetectionOptions];
}
@end
