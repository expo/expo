#import "ABI28_0_0AIRMapOverlayManager.h"

#import <ReactABI28_0_0/ABI28_0_0RCTConvert+CoreLocation.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManager.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>
#import "ABI28_0_0AIRMapOverlay.h"

@interface ABI28_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI28_0_0AIRMapOverlayManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI28_0_0AIRMapOverlay *overlay = [ABI28_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI28_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

