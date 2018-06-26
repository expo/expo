
#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <EXGL-CPP/UEXGL.h>

#import "ABI24_0_0EXGLViewManager.h"

@interface ABI24_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI24_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI24_0_0RCTDirectEventBlock onSurfaceCreate;

- (NSDictionary *)maybeStartARSession;
- (void)maybeStopARSession;
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;
- (NSDictionary *)arLightEstimation;
- (NSDictionary *)rawFeaturePoints;
- (void)setIsPlaneDetectionEnabled:(BOOL)planeDetectionEnabled;
- (void)setIsLightEstimationEnabled:(BOOL)lightEstimationEnabled;

// "protected"
@property (nonatomic, strong) EAGLContext *eaglCtx;
@property (nonatomic, assign) UEXGLContextId exglCtxId;

@end
