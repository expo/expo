#import "ABI35_0_0AIRMapOverlayManager.h"

#import <ReactABI35_0_0/ABI35_0_0RCTConvert+CoreLocation.h>
#import <ReactABI35_0_0/ABI35_0_0RCTUIManager.h>
#import <ReactABI35_0_0/UIView+ReactABI35_0_0.h>
#import "ABI35_0_0AIRMapOverlay.h"

@interface ABI35_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI35_0_0AIRMapOverlayManager

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI35_0_0AIRMapOverlay *overlay = [ABI35_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI35_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

