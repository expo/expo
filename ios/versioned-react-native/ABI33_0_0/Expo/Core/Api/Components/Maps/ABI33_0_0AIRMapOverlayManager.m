#import "ABI33_0_0AIRMapOverlayManager.h"

#import <ReactABI33_0_0/ABI33_0_0RCTConvert+CoreLocation.h>
#import <ReactABI33_0_0/ABI33_0_0RCTUIManager.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>
#import "ABI33_0_0AIRMapOverlay.h"

@interface ABI33_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI33_0_0AIRMapOverlayManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI33_0_0AIRMapOverlay *overlay = [ABI33_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI33_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

