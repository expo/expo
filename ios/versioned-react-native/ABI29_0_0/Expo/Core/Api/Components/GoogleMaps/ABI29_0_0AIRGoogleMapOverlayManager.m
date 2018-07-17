#import "ABI29_0_0AIRGoogleMapOverlayManager.h"
#import "ABI29_0_0AIRGoogleMapOverlay.h"

@interface ABI29_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI29_0_0AIRGoogleMapOverlayManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI29_0_0AIRGoogleMapOverlay *overlay = [ABI29_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI29_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end
