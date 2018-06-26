
#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import <EXGL-CPP/UEXGL.h>

#import "ABI28_0_0EXGLContext.h"
#import "ABI28_0_0EXGLViewManager.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI28_0_0EXGLView : UIView <ABI28_0_0EXGLContextDelegate>

- (instancetype)initWithManager:(ABI28_0_0EXGLViewManager *)mgr;
- (UEXGLContextId)exglCtxId;

@property (nonatomic, copy, nullable) ABI28_0_0RCTDirectEventBlock onSurfaceCreate;

- (void)setArSessionManager:(id)arSessionManager;
- (void)maybeStopARSession;
// "protected"
@property (nonatomic, strong, nullable) ABI28_0_0EXGLContext *glContext;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;

@end

NS_ASSUME_NONNULL_END
