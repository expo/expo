#import "ABI34_0_0AIRMapOverlayManager.h"

#import <ReactABI34_0_0/ABI34_0_0RCTConvert+CoreLocation.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManager.h>
#import <ReactABI34_0_0/UIView+ReactABI34_0_0.h>
#import "ABI34_0_0AIRMapOverlay.h"

@interface ABI34_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI34_0_0AIRMapOverlayManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI34_0_0AIRMapOverlay *overlay = [ABI34_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI34_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

