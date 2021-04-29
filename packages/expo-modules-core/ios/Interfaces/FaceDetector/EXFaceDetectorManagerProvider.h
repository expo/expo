// Copyright © 2018 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXFaceDetectorManager.h>

@protocol EXFaceDetectorManagerProvider

- (id<EXFaceDetectorManager>)createFaceDetectorManager;

@end
