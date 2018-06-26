
#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <EXGL-CPP/UEXGL.h>

#import "ABI25_0_0EXGLViewManager.h"

@interface ABI25_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI25_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI25_0_0RCTDirectEventBlock onSurfaceCreate;

- (NSDictionary *)maybeStartARSession;
- (void)maybeStopARSession;
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;
- (NSDictionary *)arLightEstimation;
- (NSDictionary *)rawFeaturePoints;
- (NSDictionary *)planes;
- (void)setIsPlaneDetectionEnabled:(BOOL)planeDetectionEnabled;
- (void)setIsLightEstimationEnabled:(BOOL)lightEstimationEnabled;
- (void)setWorldAlignment:(NSInteger)worldAlignment;

// "protected"
@property (nonatomic, strong) EAGLContext *eaglCtx;
@property (nonatomic, assign) UEXGLContextId exglCtxId;

@end
