#import "AIRMapOverlayManager.h"

#import <React/RCTConvert+CoreLocation.h>
#import <React/RCTUIManager.h>
#import <React/UIView+React.h>
#import "AIRMapOverlay.h"

@interface AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation AIRMapOverlayManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
    AIRMapOverlay *overlay = [AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

