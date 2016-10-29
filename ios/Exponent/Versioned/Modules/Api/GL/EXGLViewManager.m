#import "EXGLViewManager.h"

#import "EXGLView.h"

@implementation EXGLViewManager

RCT_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[EXGLView alloc] initWithManager:self];
}

RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, RCTDirectEventBlock);

@end
