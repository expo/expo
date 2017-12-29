#import "ABI23_0_0EXGLView.h"

@interface ABI23_0_0EXGLARSessionManager : NSObject

- (NSDictionary *)startARSessionWithGLView:(ABI23_0_0EXGLView *)glView;
- (void)stopARSession;
- (void)updateARCamTexture;
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;

@end

