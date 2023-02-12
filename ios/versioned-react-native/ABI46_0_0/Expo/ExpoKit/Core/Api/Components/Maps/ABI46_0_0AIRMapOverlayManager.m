#import "ABI46_0_0AIRMapOverlayManager.h"

#import <ABI46_0_0React/ABI46_0_0RCTConvert+CoreLocation.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManager.h>
#import <ABI46_0_0React/ABI46_0_0UIView+React.h>
#import "ABI46_0_0AIRMapOverlay.h"

@interface ABI46_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI46_0_0AIRMapOverlayManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI46_0_0AIRMapOverlay *overlay = [ABI46_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI46_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

