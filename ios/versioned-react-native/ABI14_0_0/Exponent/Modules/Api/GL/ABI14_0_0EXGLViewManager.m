#import "ABI14_0_0EXGLViewManager.h"

#import "ABI14_0_0EXGLView.h"

@implementation ABI14_0_0EXGLViewManager

ABI14_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI14_0_0EXGLView alloc] initWithManager:self];
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

@end
