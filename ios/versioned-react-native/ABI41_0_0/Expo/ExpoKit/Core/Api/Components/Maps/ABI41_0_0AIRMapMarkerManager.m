/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI41_0_0AIRMapMarkerManager.h"

#import <ABI41_0_0React/ABI41_0_0RCTConvert+CoreLocation.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>
#import <ABI41_0_0React/ABI41_0_0UIView+React.h>
#import "ABI41_0_0AIRMapMarker.h"

@interface ABI41_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI41_0_0AIRMapMarkerManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI41_0_0AIRMapMarker *marker = [ABI41_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI41_0_0RCTBubblingEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI41_0_0RCTDirectEventBlock)


ABI41_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI41_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI41_0_0ReactTag];
        if (![view isKindOfClass:[ABI41_0_0AIRMapMarker class]]) {
            ABI41_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI41_0_0AIRMap, got: %@", view);
        } else {
            [(ABI41_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI41_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI41_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI41_0_0ReactTag];
        if (![view isKindOfClass:[ABI41_0_0AIRMapMarker class]]) {
            ABI41_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI41_0_0AIRMap, got: %@", view);
        } else {
            [(ABI41_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI41_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI41_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI41_0_0ReactTag];
        if (![view isKindOfClass:[ABI41_0_0AIRMapMarker class]]) {
            ABI41_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI41_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
