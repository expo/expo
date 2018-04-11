
#import <React/RCTBridge.h>
#import <UEXGL.h>

#import "EXGLViewManager.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXGLView : UIView

- (instancetype)initWithManager:(EXGLViewManager *)mgr;
- (void)runOnGLThreadAsync:(void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options callback:(void(^)(NSMutableDictionary *))callback;

@property (nonatomic, copy, nullable) RCTDirectEventBlock onSurfaceCreate;

- (nonnull NSDictionary *)maybeStartARSession;
- (void)maybeStopARSession;
- (nullable NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;
- (nullable NSDictionary *)arLightEstimation;
- (nullable NSDictionary *)rawFeaturePoints;
- (nullable NSDictionary *)planes;
- (void)setIsPlaneDetectionEnabled:(BOOL)planeDetectionEnabled;
- (void)setIsLightEstimationEnabled:(BOOL)lightEstimationEnabled;
- (void)setWorldAlignment:(NSInteger)worldAlignment;

// "protected"
@property (nonatomic, strong, nullable) EAGLContext *eaglCtx;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;
@property (nonatomic, assign) UEXGLContextId exglCtxId;

@end

NS_ASSUME_NONNULL_END
