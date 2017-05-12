#import "ABI17_0_0EXGLViewManager.h"

#import "ABI17_0_0EXGLView.h"

@implementation ABI17_0_0EXGLViewManager

ABI17_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI17_0_0EXGLView alloc] initWithManager:self];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI17_0_0RCTDirectEventBlock);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

@end
