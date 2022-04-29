/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI45_0_0AIRMapMarkerManager.h"

#import <ABI45_0_0React/ABI45_0_0RCTConvert+CoreLocation.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>
#import "ABI45_0_0AIRMapMarker.h"

@interface ABI45_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI45_0_0AIRMapMarkerManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI45_0_0AIRMapMarker *marker = [ABI45_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(isPreselected, BOOL)

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI45_0_0RCTBubblingEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI45_0_0RCTDirectEventBlock)


ABI45_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI45_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI45_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI45_0_0ReactTag];
        if (![view isKindOfClass:[ABI45_0_0AIRMapMarker class]]) {
            ABI45_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI45_0_0AIRMap, got: %@", view);
        } else {
            [(ABI45_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI45_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI45_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI45_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI45_0_0ReactTag];
        if (![view isKindOfClass:[ABI45_0_0AIRMapMarker class]]) {
            ABI45_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI45_0_0AIRMap, got: %@", view);
        } else {
            [(ABI45_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI45_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI45_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI45_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI45_0_0ReactTag];
        if (![view isKindOfClass:[ABI45_0_0AIRMapMarker class]]) {
            ABI45_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI45_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
