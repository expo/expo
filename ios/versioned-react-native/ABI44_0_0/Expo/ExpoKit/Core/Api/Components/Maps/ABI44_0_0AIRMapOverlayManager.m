#import "ABI44_0_0AIRMapOverlayManager.h"

#import <ABI44_0_0React/ABI44_0_0RCTConvert+CoreLocation.h>
#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>
#import "ABI44_0_0AIRMapOverlay.h"

@interface ABI44_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI44_0_0AIRMapOverlayManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI44_0_0AIRMapOverlay *overlay = [ABI44_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI44_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

