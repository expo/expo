#import "ABI32_0_0AIRMapOverlayManager.h"

#import <ReactABI32_0_0/ABI32_0_0RCTConvert+CoreLocation.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManager.h>
#import <ReactABI32_0_0/UIView+ReactABI32_0_0.h>
#import "ABI32_0_0AIRMapOverlay.h"

@interface ABI32_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI32_0_0AIRMapOverlayManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI32_0_0AIRMapOverlay *overlay = [ABI32_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI32_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

