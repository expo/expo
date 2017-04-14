#import "ABI16_0_0EXGLViewManager.h"

#import "ABI16_0_0EXGLView.h"

@implementation ABI16_0_0EXGLViewManager

ABI16_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI16_0_0EXGLView alloc] initWithManager:self];
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

@end
