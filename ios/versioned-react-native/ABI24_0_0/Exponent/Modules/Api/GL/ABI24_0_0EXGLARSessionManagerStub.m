
#import "ABI24_0_0EXGLARSessionManagerStub.h"

@implementation ABI24_0_0EXGLARSessionManagerStub

- (NSDictionary *)startARSessionWithGLView:(ABI24_0_0EXGLView *)glView { return @{}; }
- (void)stopARSession {}
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar { return @{}; }
- (NSDictionary *)arLightEstimation { return @{}; }
- (NSDictionary *)rawFeaturePoints { return @{}; }
- (void)setIsPlaneDetectionEnabled:(BOOL)planeDetectionEnabled {}
- (void)setIsLightEstimationEnabled:(BOOL)lightEstimationEnabled {}
- (void)updateARCamTexture {}

@end
