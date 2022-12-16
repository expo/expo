#import "ABI45_0_0AIRMapOverlayManager.h"

#import <ABI45_0_0React/ABI45_0_0RCTConvert+CoreLocation.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>
#import "ABI45_0_0AIRMapOverlay.h"

@interface ABI45_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI45_0_0AIRMapOverlayManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI45_0_0AIRMapOverlay *overlay = [ABI45_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI45_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

