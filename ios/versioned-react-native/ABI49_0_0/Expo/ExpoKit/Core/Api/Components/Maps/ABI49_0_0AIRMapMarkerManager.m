/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI49_0_0AIRMapMarkerManager.h"

#import <ABI49_0_0React/ABI49_0_0RCTConvert+CoreLocation.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>
#import "ABI49_0_0AIRMapMarker.h"

@interface ABI49_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI49_0_0AIRMapMarkerManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI49_0_0AIRMapMarker *marker = [ABI49_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(isPreselected, BOOL)

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI49_0_0RCTBubblingEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI49_0_0RCTDirectEventBlock)


ABI49_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI49_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI49_0_0ReactTag];
        if (![view isKindOfClass:[ABI49_0_0AIRMapMarker class]]) {
            ABI49_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI49_0_0AIRMap, got: %@", view);
        } else {
            [(ABI49_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI49_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI49_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI49_0_0ReactTag];
        if (![view isKindOfClass:[ABI49_0_0AIRMapMarker class]]) {
            ABI49_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI49_0_0AIRMap, got: %@", view);
        } else {
            [(ABI49_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI49_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI49_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI49_0_0ReactTag];
        if (![view isKindOfClass:[ABI49_0_0AIRMapMarker class]]) {
            ABI49_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI49_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
