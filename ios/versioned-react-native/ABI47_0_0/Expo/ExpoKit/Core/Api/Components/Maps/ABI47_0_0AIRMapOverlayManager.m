#import "ABI47_0_0AIRMapOverlayManager.h"

#import <ABI47_0_0React/ABI47_0_0RCTConvert+CoreLocation.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>
#import "ABI47_0_0AIRMapOverlay.h"

@interface ABI47_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI47_0_0AIRMapOverlayManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI47_0_0AIRMapOverlay *overlay = [ABI47_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI47_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

