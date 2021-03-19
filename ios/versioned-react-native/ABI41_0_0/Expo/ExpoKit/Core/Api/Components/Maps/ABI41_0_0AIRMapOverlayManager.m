#import "ABI41_0_0AIRMapOverlayManager.h"

#import <ABI41_0_0React/ABI41_0_0RCTConvert+CoreLocation.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>
#import <ABI41_0_0React/ABI41_0_0UIView+React.h>
#import "ABI41_0_0AIRMapOverlay.h"

@interface ABI41_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI41_0_0AIRMapOverlayManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI41_0_0AIRMapOverlay *overlay = [ABI41_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI41_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

