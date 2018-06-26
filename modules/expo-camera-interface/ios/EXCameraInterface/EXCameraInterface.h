// Copyright 2018-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>

@protocol EXCameraInterface

@property (nonatomic, strong) dispatch_queue_t sessionQueue;
@property (nonatomic, strong) AVCaptureSession *session;

@end
