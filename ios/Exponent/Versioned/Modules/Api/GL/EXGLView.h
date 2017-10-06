
#import <React/RCTBridge.h>
#import <UEXGL.h>

#import "EXGLViewManager.h"

@interface EXGLView : UIView

- (instancetype)initWithManager:(EXGLViewManager *)mgr;

@property (nonatomic, copy) RCTDirectEventBlock onSurfaceCreate;

- (NSDictionary *)maybeStartARSession;
- (void)maybeStopARSession;
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;

// "protected"
@property (nonatomic, strong) EAGLContext *eaglCtx;
@property (nonatomic, assign) UEXGLContextId exglCtxId;

@end
