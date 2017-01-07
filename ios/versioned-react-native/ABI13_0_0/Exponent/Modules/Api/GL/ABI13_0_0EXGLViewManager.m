#import "ABI13_0_0EXGLViewManager.h"

#import "ABI13_0_0EXGLView.h"

@implementation ABI13_0_0EXGLViewManager

ABI13_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI13_0_0EXGLView alloc] initWithManager:self];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI13_0_0RCTDirectEventBlock);

@end
