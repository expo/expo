#import "ABI23_0_0EXGLView.h"

@interface ABI23_0_0EXGLARSessionManagerStub : NSObject

- (NSDictionary *)startARSessionWithGLView:(ABI23_0_0EXGLView *)glView;
- (void)stopARSession;
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;
- (void)updateARCamTexture;

@end


