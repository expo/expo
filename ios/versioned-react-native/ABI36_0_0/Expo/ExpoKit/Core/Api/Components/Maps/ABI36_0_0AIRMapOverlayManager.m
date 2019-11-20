#import "ABI36_0_0AIRMapOverlayManager.h"

#import <ABI36_0_0React/ABI36_0_0RCTConvert+CoreLocation.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManager.h>
#import <ABI36_0_0React/ABI36_0_0UIView+React.h>
#import "ABI36_0_0AIRMapOverlay.h"

@interface ABI36_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI36_0_0AIRMapOverlayManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI36_0_0AIRMapOverlay *overlay = [ABI36_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI36_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

