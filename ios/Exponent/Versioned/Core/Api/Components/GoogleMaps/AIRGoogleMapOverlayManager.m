#import "AIRGoogleMapOverlayManager.h"
#import "AIRGoogleMapOverlay.h"

@interface AIRGoogleMapOverlayManager()

@end

@implementation AIRGoogleMapOverlayManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  AIRGoogleMapOverlay *overlay = [AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end
