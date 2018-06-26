
#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <EXGL-CPP/UEXGL.h>

#import "ABI26_0_0EXGLViewManager.h"

@interface ABI26_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI26_0_0EXGLViewManager *)mgr;
- (void)runOnGLThreadAsync:(void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options callback:(void(^)(NSMutableDictionary *))callback;

@property (nonatomic, copy) ABI26_0_0RCTDirectEventBlock onSurfaceCreate;

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
