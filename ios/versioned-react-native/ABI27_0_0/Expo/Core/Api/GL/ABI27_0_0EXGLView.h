
#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import <EXGL-CPP/UEXGL.h>

#import "ABI27_0_0EXGLContext.h"
#import "ABI27_0_0EXGLViewManager.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI27_0_0EXGLView : UIView <ABI27_0_0EXGLContextDelegate>

- (instancetype)initWithManager:(ABI27_0_0EXGLViewManager *)mgr;
- (UEXGLContextId)exglCtxId;

@property (nonatomic, copy, nullable) ABI27_0_0RCTDirectEventBlock onSurfaceCreate;

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
@property (nonatomic, strong, nullable) ABI27_0_0EXGLContext *glContext;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;

@end

NS_ASSUME_NONNULL_END
