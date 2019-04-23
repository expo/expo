//
//  FIRVisionFaceDetectorOptions+Extension.h
//  EXFaceDetector
//
//  Created by Michał Czernek on 19/04/2019.
//

#import <Foundation/Foundation.h>
#import "Firebase.h"

NS_ASSUME_NONNULL_BEGIN

@interface FIRVisionFaceDetectorOptions (Immutbility)

- (BOOL)optionsChanged:(id)other;
- (id)createCopy;

@end

NS_ASSUME_NONNULL_END
