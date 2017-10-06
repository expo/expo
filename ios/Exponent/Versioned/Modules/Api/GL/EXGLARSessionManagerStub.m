
#import "EXGLARSessionManagerStub.h"

@implementation EXGLARSessionManagerStub

- (NSDictionary *)startARSessionWithGLView:(EXGLView *)glView { return @{}; }
- (void)stopARSession {}
- (NSDictionary *)arMatricesForViewportSize:(CGSize)viewportSize zNear:(CGFloat)zNear zFar:(CGFloat)zFar { return @{}; }
- (void)updateARCamTexture {}

@end
