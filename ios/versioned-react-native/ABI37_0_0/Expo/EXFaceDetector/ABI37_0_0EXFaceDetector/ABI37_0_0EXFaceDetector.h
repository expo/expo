//
//  ABI37_0_0EXFaceDetector.h
//  ABI37_0_0EXFaceDetector
//
//  Created by Michał Czernek on 12/04/2019.
//

#import <Foundation/Foundation.h>
#import <Firebase/Firebase.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI37_0_0EXFaceDetector : NSObject

-(instancetype) initWithOptions:(FIRVisionFaceDetectorOptions *)options;
-(void) detectFromImage:(UIImage *)image completionListener:(void(^)(NSArray<FIRVisionFace *> *faces, NSError* error)) completion;
-(void) detectFromBuffer:(CMSampleBufferRef)buffer metadata:(FIRVisionImageMetadata *)metadata completionListener:(void(^)(NSArray<FIRVisionFace *> *faces, NSError *error))completion;

@end

NS_ASSUME_NONNULL_END
