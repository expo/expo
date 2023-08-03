#import "ABI49_0_0AIRMapOverlayManager.h"

#import <ABI49_0_0React/ABI49_0_0RCTConvert+CoreLocation.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>
#import "ABI49_0_0AIRMapOverlay.h"

@interface ABI49_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI49_0_0AIRMapOverlayManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI49_0_0AIRMapOverlay *overlay = [ABI49_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI49_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

