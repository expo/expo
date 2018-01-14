
#import "ABI25_0_0EXGLARSessionManagerStub.h"

@implementation ABI25_0_0EXGLARSessionManagerStub

- (NSDictionary *)startARSessionWithGLView:(ABI25_0_0EXGLView *)glView { return @{}; }
- (void)stopARSession {}
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar { return @{}; }
- (NSDictionary *)arLightEstimation { return @{}; }
- (NSDictionary *)rawFeaturePoints { return @{}; }
- (NSDictionary *)planes { return @{}; }
- (void)setIsPlaneDetectionEnabled:(BOOL)planeDetectionEnabled {}
- (void)setIsLightEstimationEnabled:(BOOL)lightEstimationEnabled {}
- (void)updateARCamTexture {}

@end
