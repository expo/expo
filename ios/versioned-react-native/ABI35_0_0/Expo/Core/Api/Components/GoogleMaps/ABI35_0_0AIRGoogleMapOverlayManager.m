#import "ABI35_0_0AIRGoogleMapOverlayManager.h"
#import "ABI35_0_0AIRGoogleMapOverlay.h"

@interface ABI35_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI35_0_0AIRGoogleMapOverlayManager

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI35_0_0AIRGoogleMapOverlay *overlay = [ABI35_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI35_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end
