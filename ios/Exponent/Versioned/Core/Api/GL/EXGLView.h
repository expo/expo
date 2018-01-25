
#import <React/RCTBridge.h>
#import <UEXGL.h>

#import "EXGLViewManager.h"

@interface EXGLView : UIView

- (instancetype)initWithManager:(EXGLViewManager *)mgr;
- (void)runOnGLThreadAsync:(void(^)(void))callback;

@property (nonatomic, copy) RCTDirectEventBlock onSurfaceCreate;

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
@property (nonatomic, strong) EAGLContext *uiEaglCtx;
@property (nonatomic, assign) UEXGLContextId exglCtxId;

@end
