#import "EXCamera.h"
#import "EXGLView.h"
#import "EXGLObject.h"

@interface EXGLCameraObject : EXGLObject

- (instancetype)initWithView:(EXGLView *)glView andCamera:(EXCamera *)camera;

@end
