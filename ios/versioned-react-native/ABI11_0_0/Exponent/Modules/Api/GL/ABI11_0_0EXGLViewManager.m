#import "ABI11_0_0EXGLViewManager.h"

#import "ABI11_0_0EXGLView.h"

@implementation ABI11_0_0EXGLViewManager

ABI11_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI11_0_0EXGLView alloc] initWithManager:self];
}

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI11_0_0RCTDirectEventBlock);

@end
