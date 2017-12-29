#import "ABI22_0_0EXGLView.h"

@interface ABI22_0_0EXGLARSessionManager : NSObject

- (NSDictionary *)startARSessionWithGLView:(ABI22_0_0EXGLView *)glView;
- (void)stopARSession;
- (void)updateARCamTexture;
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;

@end

