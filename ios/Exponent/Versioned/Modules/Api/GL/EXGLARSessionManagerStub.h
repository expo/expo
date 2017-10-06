#import "EXGLView.h"

@interface EXGLARSessionManagerStub : NSObject

- (NSDictionary *)startARSessionWithGLView:(EXGLView *)glView;
- (void)stopARSession;
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar;
- (void)updateARCamTexture;

@end


