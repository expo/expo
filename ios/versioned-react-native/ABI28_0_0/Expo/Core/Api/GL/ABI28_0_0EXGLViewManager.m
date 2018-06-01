#import "ABI28_0_0EXGLViewManager.h"

#import "ABI28_0_0EXGLView.h"

#import <ReactABI28_0_0/ABI28_0_0RCTUIManager.h>

@interface ABI28_0_0EXGLViewManager ()

@end

@implementation ABI28_0_0EXGLViewManager

ABI28_0_0RCT_EXPORT_MODULE(ExponentGLViewManager);

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (UIView *)view
{
  return [[ABI28_0_0EXGLView alloc] initWithManager:self];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, ABI28_0_0RCTDirectEventBlock);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

@end
