#import "ABI20_0_0EXGLViewManager.h"

#import "ABI20_0_0EXGLView.h"

@implementation ABI20_0_0EXGLViewManager

ABI20_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI20_0_0EXGLView alloc] initWithManager:self];
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI20_0_0RCTDirectEventBlock);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

@end
