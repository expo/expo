#import "ABI42_0_0AIRMapOverlayManager.h"

#import <ABI42_0_0React/ABI42_0_0RCTConvert+CoreLocation.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>
#import "ABI42_0_0AIRMapOverlay.h"

@interface ABI42_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI42_0_0AIRMapOverlayManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI42_0_0AIRMapOverlay *overlay = [ABI42_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI42_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

