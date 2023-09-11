/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI47_0_0AIRMapMarkerManager.h"

#import <ABI47_0_0React/ABI47_0_0RCTConvert+CoreLocation.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>
#import "ABI47_0_0AIRMapMarker.h"

@interface ABI47_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI47_0_0AIRMapMarkerManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI47_0_0AIRMapMarker *marker = [ABI47_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(isPreselected, BOOL)

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI47_0_0RCTDirectEventBlock)


ABI47_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI47_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        if (![view isKindOfClass:[ABI47_0_0AIRMapMarker class]]) {
            ABI47_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view);
        } else {
            [(ABI47_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI47_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI47_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        if (![view isKindOfClass:[ABI47_0_0AIRMapMarker class]]) {
            ABI47_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view);
        } else {
            [(ABI47_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI47_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI47_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        if (![view isKindOfClass:[ABI47_0_0AIRMapMarker class]]) {
            ABI47_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
