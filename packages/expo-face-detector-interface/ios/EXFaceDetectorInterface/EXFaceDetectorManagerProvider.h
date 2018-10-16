// Copyright © 2018 650 Industries. All rights reserved.

#import <EXFaceDetectorInterface/EXFaceDetectorManager.h>

@protocol EXFaceDetectorManagerProvider

- (id<EXFaceDetectorManager>)createFaceDetectorManager;

@end
