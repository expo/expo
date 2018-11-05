#import "ABI30_0_0AIRMapOverlayManager.h"

#import <ReactABI30_0_0/ABI30_0_0RCTConvert+CoreLocation.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>
#import <ReactABI30_0_0/UIView+ReactABI30_0_0.h>
#import "ABI30_0_0AIRMapOverlay.h"

@interface ABI30_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI30_0_0AIRMapOverlayManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI30_0_0AIRMapOverlay *overlay = [ABI30_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI30_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

