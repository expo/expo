#import "EXGLGPUImageObject.h"

#import <GPUImage.h>

@interface EXGLGPUImageObject () <GPUImageTextureOutputDelegate>

@property (nonatomic, strong) GPUImageOutput *gpuImageOutput;
@property (nonatomic, strong) GPUImageTextureOutput *gpuImageTextureOutput;

@end

@implementation EXGLGPUImageObject

- (instancetype)initWithConfig:(NSDictionary *)config
{
  if ((self = [super initWithConfig:config])) {
    _gpuImageOutput = nil;
    _gpuImageTextureOutput = nil;

    // Construct the right kind of `GPUImageOutput` for `config`
    if (config[@"texture"][@"camera"]) {
      NSString *sessionPreset = AVCaptureSessionPreset640x480; // TODO: Read this from `config`
      AVCaptureDevicePosition position = ([config[@"texture"][@"camera"][@"position"] isEqualToString:@"front"] ?
                                          AVCaptureDevicePositionFront : AVCaptureDevicePositionBack);
      GPUImageVideoCamera *gpuImageVideoCamera = [[GPUImageVideoCamera alloc]
                                                  initWithSessionPreset:sessionPreset cameraPosition:position];
      gpuImageVideoCamera.outputImageOrientation = UIInterfaceOrientationPortrait; // You can rotate it in GL yourself ¯\_(ツ)_/¯
      [gpuImageVideoCamera startCameraCapture]; // TODO: Don't start yet, allow updating config with `playing` as property
      _gpuImageOutput = gpuImageVideoCamera;
    }

    if (_gpuImageOutput) {
      _gpuImageTextureOutput = [[GPUImageTextureOutput alloc] init];
      [_gpuImageOutput addTarget:_gpuImageTextureOutput];
      _gpuImageTextureOutput.delegate = self;
    } else {
      return nil;
    }
  }
  return self;
}

- (void)newFrameReadyFromTextureOutput:(GPUImageTextureOutput *)callbackTextureOutput
{
  // Remember that `UEXGLContextMapObject(...)` needs to run on the GL thread
  dispatch_async(dispatch_get_main_queue(), ^{
    UEXGLContextMapObject(self.exglCtxId, self.exglObjId, callbackTextureOutput.texture);
    // Some times a refCount > 0 assertion fails so just guard this
    @try {
      [callbackTextureOutput doneWithTexture];
    } @catch (NSException *exception) {
      // ¯\_(ツ)_/¯
    }
  });
}

@end
