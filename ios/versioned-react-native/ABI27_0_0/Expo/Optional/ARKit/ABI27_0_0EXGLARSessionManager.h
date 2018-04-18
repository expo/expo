#import "ABI27_0_0EXGLView.h"

@interface ABI27_0_0EXGLARSessionManager : NSObject

- (NSDictionary *)startARSessionWithGLView:(ABI27_0_0EXGLView *)glView;
- (void)stopARSession;
- (void)updateARCamTexture;
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;
- (NSDictionary *)arLightEstimation;
- (NSDictionary *)rawFeaturePoints;
- (NSDictionary *)planes;

@property (nonatomic, assign) BOOL isPlaneDetectionEnabled;
@property (nonatomic, assign) BOOL isLightEstimationEnabled;
@property (nonatomic, assign) NSInteger worldAlignment;

@end

