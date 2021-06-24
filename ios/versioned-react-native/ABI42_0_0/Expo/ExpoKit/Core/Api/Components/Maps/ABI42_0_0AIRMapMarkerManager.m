/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI42_0_0AIRMapMarkerManager.h"

#import <ABI42_0_0React/ABI42_0_0RCTConvert+CoreLocation.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>
#import "ABI42_0_0AIRMapMarker.h"

@interface ABI42_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI42_0_0AIRMapMarkerManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI42_0_0AIRMapMarker *marker = [ABI42_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI42_0_0RCTBubblingEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI42_0_0RCTDirectEventBlock)


ABI42_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI42_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI42_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI42_0_0ReactTag];
        if (![view isKindOfClass:[ABI42_0_0AIRMapMarker class]]) {
            ABI42_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI42_0_0AIRMap, got: %@", view);
        } else {
            [(ABI42_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI42_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI42_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI42_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI42_0_0ReactTag];
        if (![view isKindOfClass:[ABI42_0_0AIRMapMarker class]]) {
            ABI42_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI42_0_0AIRMap, got: %@", view);
        } else {
            [(ABI42_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI42_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI42_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI42_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI42_0_0ReactTag];
        if (![view isKindOfClass:[ABI42_0_0AIRMapMarker class]]) {
            ABI42_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI42_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
