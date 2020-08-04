#import "ABI37_0_0AIRMapOverlayManager.h"

#import <ABI37_0_0React/ABI37_0_0RCTConvert+CoreLocation.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManager.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>
#import "ABI37_0_0AIRMapOverlay.h"

@interface ABI37_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI37_0_0AIRMapOverlayManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI37_0_0AIRMapOverlay *overlay = [ABI37_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI37_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

