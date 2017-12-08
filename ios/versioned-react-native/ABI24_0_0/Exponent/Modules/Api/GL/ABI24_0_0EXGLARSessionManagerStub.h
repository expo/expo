#import "ABI24_0_0EXGLView.h"

@interface ABI24_0_0EXGLARSessionManagerStub : NSObject

- (NSDictionary *)startARSessionWithGLView:(ABI24_0_0EXGLView *)glView;
- (void)stopARSession;
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;
- (NSDictionary *)arLightEstimation;
- (NSDictionary *)rawFeaturePoints;
- (void)setIsPlaneDetectionEnabled:(BOOL)planeDetectionEnabled;
- (void)setIsLightEstimationEnabled:(BOOL)lightEstimationEnabled;
- (void)updateARCamTexture;

@end


