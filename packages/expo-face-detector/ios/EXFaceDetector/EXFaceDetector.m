//
//  EXFaceDetector.m
//  EXFaceDetector
//
//  Created by Michał Czernek on 12/04/2019.
//

#import "EXFaceDetector.h"
#import "Firebase.h"

static const NSString *kModeOptionName = @"performanceMode";
static const NSString *kDetectLandmarksOptionName = @"landmarkMode";
static const NSString *kRunClassificationsOptionName = @"classificationMode";

@implementation EXFaceDetector

FIRVisionFaceDetector* detector;

-(instancetype) initWithOptions:(NSDictionary*)options {
  self = [super init];
  detector = [EXFaceDetector detectorForOptions:options];
  return self;
}

-(void) detectFromImage:(UIImage*)image completionListener:(void(^)(NSArray<FIRVisionFace*>* faces, NSError* error)) completion {
  if(image != nil) {
    FIRVisionImage *visionImage = [[FIRVisionImage alloc] initWithImage:image];
    [self detectFromFIRImage:visionImage completionListener:completion];
  }
}

-(void) detectFromBuffer:(CMSampleBufferRef)buffer metadata:(FIRVisionImageMetadata*)metadata completionListener:(void(^)(NSArray<FIRVisionFace *> *faces, NSError *error))completion {
  if(buffer != nil) {
    FIRVisionImage *visionImage = [[FIRVisionImage alloc] initWithBuffer:buffer];
    visionImage.metadata = metadata;
    [self detectFromFIRImage:visionImage completionListener:completion];
  }
}

-(void) detectFromFIRImage:(FIRVisionImage*)image completionListener:(void(^)(NSArray<FIRVisionFace *> *faces, NSError *error))completion {
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
