#import "ABI31_0_0AIRMapOverlayManager.h"

#import <ReactABI31_0_0/ABI31_0_0RCTConvert+CoreLocation.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManager.h>
#import <ReactABI31_0_0/UIView+ReactABI31_0_0.h>
#import "ABI31_0_0AIRMapOverlay.h"

@interface ABI31_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI31_0_0AIRMapOverlayManager

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI31_0_0AIRMapOverlay *overlay = [ABI31_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI31_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

