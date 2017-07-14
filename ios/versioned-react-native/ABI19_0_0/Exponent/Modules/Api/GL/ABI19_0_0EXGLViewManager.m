#import "ABI19_0_0EXGLViewManager.h"

#import "ABI19_0_0EXGLView.h"

@implementation ABI19_0_0EXGLViewManager

ABI19_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI19_0_0EXGLView alloc] initWithManager:self];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI19_0_0RCTDirectEventBlock);
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

@end
