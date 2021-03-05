#import "ABI40_0_0AIRMapOverlayManager.h"

#import <ABI40_0_0React/ABI40_0_0RCTConvert+CoreLocation.h>
#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>
#import <ABI40_0_0React/ABI40_0_0UIView+React.h>
#import "ABI40_0_0AIRMapOverlay.h"

@interface ABI40_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI40_0_0AIRMapOverlayManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI40_0_0AIRMapOverlay *overlay = [ABI40_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI40_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

