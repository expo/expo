#import "ABI12_0_0EXGLViewManager.h"

#import "ABI12_0_0EXGLView.h"

@implementation ABI12_0_0EXGLViewManager

ABI12_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI12_0_0EXGLView alloc] initWithManager:self];
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI12_0_0RCTDirectEventBlock);

@end
