#import "ABI39_0_0AIRGoogleMapOverlayManager.h"
#import "ABI39_0_0AIRGoogleMapOverlay.h"

@interface ABI39_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI39_0_0AIRGoogleMapOverlayManager

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI39_0_0AIRGoogleMapOverlay *overlay = [ABI39_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI39_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
