#import "ABI43_0_0AIRMapOverlayManager.h"

#import <ABI43_0_0React/ABI43_0_0RCTConvert+CoreLocation.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import <ABI43_0_0React/ABI43_0_0UIView+React.h>
#import "ABI43_0_0AIRMapOverlay.h"

@interface ABI43_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI43_0_0AIRMapOverlayManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI43_0_0AIRMapOverlay *overlay = [ABI43_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI43_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

