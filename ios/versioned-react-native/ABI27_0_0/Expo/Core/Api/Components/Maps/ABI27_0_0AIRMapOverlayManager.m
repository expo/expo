#import "ABI27_0_0AIRMapOverlayManager.h"

#import <ReactABI27_0_0/ABI27_0_0RCTConvert+CoreLocation.h>
#import <ReactABI27_0_0/ABI27_0_0RCTUIManager.h>
#import <ReactABI27_0_0/UIView+ReactABI27_0_0.h>
#import "ABI27_0_0AIRMapOverlay.h"

@interface ABI27_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI27_0_0AIRMapOverlayManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI27_0_0AIRMapOverlay *overlay = [ABI27_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI27_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

