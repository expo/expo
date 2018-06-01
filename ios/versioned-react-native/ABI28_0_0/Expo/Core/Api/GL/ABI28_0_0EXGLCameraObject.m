#include <OpenGLES/ES3/gl.h>
#include <OpenGLES/ES3/glext.h>

#import "ABI28_0_0EXGLCameraObject.h"
#import "ABI28_0_0EXGLView.h"

@interface ABI28_0_0EXGLCameraObject () <AVCaptureVideoDataOutputSampleBufferDelegate>

@property (nonatomic, strong) ABI28_0_0EXCamera *camera;
@property (nonatomic, strong) EAGLContext *eaglCtx;
@property (nonatomic, strong) AVCaptureVideoDataOutput *cameraOutput;
@property (nonatomic, assign) CVOpenGLESTextureCacheRef cameraTextureCache;

@end

@implementation ABI28_0_0EXGLCameraObject

- (instancetype)initWithView:(ABI28_0_0EXGLView *)glView andCamera:(ABI28_0_0EXCamera *)camera
{
  UEXGLContextId exglCtxId = [glView.glContext contextId];

  if (self = [super initWithConfig:@{ @"exglCtxId": @(exglCtxId) }]) {
    _eaglCtx = [glView.glContext createSharedEAGLContext];
    _camera = camera;

    dispatch_async(camera.sessionQueue, ^{
      AVCaptureVideoDataOutput *videoOutput = [[AVCaptureVideoDataOutput alloc] init];

      if ([camera.session canAddOutput:videoOutput]) {
        videoOutput.videoSettings = @{ (id)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32BGRA) };
        [videoOutput setSampleBufferDelegate:self queue:camera.sessionQueue];
        [videoOutput setAlwaysDiscardsLateVideoFrames:YES];
        [camera.session addOutput:videoOutput];
        _cameraOutput = videoOutput;
      }
    });
  }
  return self;
}

- (void)dealloc
{
  if (_cameraOutput) {
    [_camera.session removeOutput:_cameraOutput];
    [_cameraOutput setSampleBufferDelegate:nil queue:nil];
  }
}

- (void)captureOutput:(AVCaptureOutput *)output didOutputSampleBuffer:(CMSampleBufferRef)sampleBuffer fromConnection:(AVCaptureConnection *)connection
{
  [connection setVideoOrientation:AVCaptureVideoOrientationPortrait];
  [connection setVideoMirrored:YES];

  CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
  GLsizei bufferWidth = (GLsizei)CVPixelBufferGetWidth(pixelBuffer);
  GLsizei bufferHeight = (GLsizei)CVPixelBufferGetHeight(pixelBuffer);
  
  CVPixelBufferRetain(pixelBuffer);
  CVPixelBufferLockBaseAddress(pixelBuffer, 0);

  [EAGLContext setCurrentContext:_eaglCtx];

  if (!_cameraTextureCache) {
    CVOpenGLESTextureCacheCreate(kCFAllocatorDefault, NULL, _eaglCtx, NULL, &_cameraTextureCache);
  }
  
  CVOpenGLESTextureRef textureRef = NULL;
  
  CVOpenGLESTextureCacheCreateTextureFromImage(kCFAllocatorDefault,
                                               _cameraTextureCache,
                                               pixelBuffer,
                                               NULL,
                                               GL_TEXTURE_2D,
                                               GL_RGBA,
                                               bufferWidth,
                                               bufferHeight,
                                               GL_BGRA,
                                               GL_UNSIGNED_BYTE,
                                               0,
                                               &textureRef);
  
  if (textureRef) {
    GLuint textureName = CVOpenGLESTextureGetName(textureRef);
    UEXGLContextMapObject([self exglCtxId], [self exglObjId], textureName);
  }

  CVOpenGLESTextureCacheFlush(_cameraTextureCache, 0);
  CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
  CVPixelBufferRelease(pixelBuffer);
  CFRelease(textureRef);

  [EAGLContext setCurrentContext:nil];
}

@end
