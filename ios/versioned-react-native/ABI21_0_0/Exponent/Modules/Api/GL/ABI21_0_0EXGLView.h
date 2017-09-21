#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>

#import "ABI21_0_0EXGLViewManager.h"

@interface ABI21_0_0EXGLView : UIView

- (instancetype)initWithManager:(ABI21_0_0EXGLViewManager *)mgr;

@property (nonatomic, copy) ABI21_0_0RCTDirectEventBlock onSurfaceCreate;

- (NSDictionary *)startARSession;

- (void)stopARSession;

- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;

@end
