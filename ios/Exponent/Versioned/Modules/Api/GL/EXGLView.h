#import <React/RCTBridge.h>

#import "EXGLViewManager.h"

@interface EXGLView : UIView

- (instancetype)initWithManager:(EXGLViewManager *)mgr;

@property (nonatomic, copy) RCTDirectEventBlock onSurfaceCreate;

- (NSDictionary *)startARSession;

- (void)stopARSession;

- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;

@end
