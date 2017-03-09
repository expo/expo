#import "ABI15_0_0EXGLViewManager.h"

#import "ABI15_0_0EXGLView.h"

@implementation ABI15_0_0EXGLViewManager

ABI15_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI15_0_0EXGLView alloc] initWithManager:self];
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

@end
