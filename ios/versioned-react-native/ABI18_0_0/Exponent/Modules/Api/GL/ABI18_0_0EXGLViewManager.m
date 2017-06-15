#import "ABI18_0_0EXGLViewManager.h"

#import "ABI18_0_0EXGLView.h"

@implementation ABI18_0_0EXGLViewManager

ABI18_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI18_0_0EXGLView alloc] initWithManager:self];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI18_0_0RCTDirectEventBlock);
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

@end
