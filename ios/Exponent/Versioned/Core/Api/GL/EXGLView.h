
#import <React/RCTBridge.h>
#import <UEXGL.h>

#import "EXGLContext.h"
#import "EXGLViewManager.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXGLView : UIView <EXGLContextDelegate>

- (instancetype)initWithManager:(EXGLViewManager *)mgr;
- (UEXGLContextId)exglCtxId;

@property (nonatomic, copy, nullable) RCTDirectEventBlock onSurfaceCreate;

- (void)setArSessionManager:(id)arSessionManager;
- (void)maybeStopARSession;
// "protected"
@property (nonatomic, strong, nullable) EXGLContext *glContext;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;

@end

NS_ASSUME_NONNULL_END
