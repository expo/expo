#import "ABI21_0_0EXGLViewManager.h"

#import "ABI21_0_0EXGLView.h"

@implementation ABI21_0_0EXGLViewManager

ABI21_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI21_0_0EXGLView alloc] initWithManager:self];
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI21_0_0RCTDirectEventBlock);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

@end
