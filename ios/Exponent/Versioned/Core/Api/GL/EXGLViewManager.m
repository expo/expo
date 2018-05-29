#import "EXGLViewManager.h"

#import "EXGLView.h"

#import <React/RCTUIManager.h>

@interface EXGLViewManager ()

@end

@implementation EXGLViewManager

RCT_EXPORT_MODULE(ExponentGLViewManager);

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
  return [[EXGLView alloc] initWithManager:self];
}

RCT_EXPORT_VIEW_PROPERTY(onSurfaceCreate, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(msaaSamples, NSNumber);

@end
