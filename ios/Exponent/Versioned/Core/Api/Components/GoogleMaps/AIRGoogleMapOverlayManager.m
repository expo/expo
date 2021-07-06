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
RCT_REMAP_VIEW_PROPERTY(bearing, bearing, double)
RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
