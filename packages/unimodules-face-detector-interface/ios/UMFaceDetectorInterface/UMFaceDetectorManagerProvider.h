// Copyright © 2018 650 Industries. All rights reserved.

#import <UMFaceDetectorInterface/UMFaceDetectorManager.h>

@protocol UMFaceDetectorManagerProvider

- (id<UMFaceDetectorManager>)createFaceDetectorManager;

@end
