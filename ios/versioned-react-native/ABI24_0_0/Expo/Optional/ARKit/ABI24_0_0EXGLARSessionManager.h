#import "ABI24_0_0EXGLView.h"

@interface ABI24_0_0EXGLARSessionManager : NSObject

- (NSDictionary *)startARSessionWithGLView:(ABI24_0_0EXGLView *)glView;
- (void)stopARSession;
- (void)updateARCamTexture;
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;
- (NSDictionary *)arLightEstimation;
- (NSDictionary *)rawFeaturePoints;

@property (nonatomic, assign) BOOL isPlaneDetectionEnabled;
@property (nonatomic, assign) BOOL isLightEstimationEnabled;

@end

