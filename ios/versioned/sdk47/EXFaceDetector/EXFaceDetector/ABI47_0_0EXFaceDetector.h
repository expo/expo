//
//  ABI47_0_0EXFaceDetector.h
//  ABI47_0_0EXFaceDetector
//
//  Created by Michał Czernek on 12/04/2019.
//

#import <UIKit/UIKit.h>
#import <GoogleMLKit/MLKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXFaceDetector : NSObject

- (instancetype)initWithOptions:(MLKFaceDetectorOptions *)options;
- (void)detectFromImage:(UIImage *)image
     completionListener:(void(^)(NSArray<MLKFace *> *faces, NSError* error)) completion;
- (void)detectFromBuffer:(CMSampleBufferRef)buffer
             orientation:(UIImageOrientation)orientation
      completionListener:(void(^)(NSArray<MLKFace *> *faces, NSError *error))completion;

@end

NS_ASSUME_NONNULL_END
