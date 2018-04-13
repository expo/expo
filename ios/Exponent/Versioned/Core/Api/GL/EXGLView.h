
#import <React/RCTBridge.h>
#import <UEXGL.h>

#import "EXGLContext.h"
#import "EXGLViewManager.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXGLView : UIView <EXGLContextDelegate>

- (instancetype)initWithManager:(EXGLViewManager *)mgr;
- (UEXGLContextId)exglCtxId;

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
@property (nonatomic, strong, nullable) EXGLContext *glContext;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;

@end

NS_ASSUME_NONNULL_END
