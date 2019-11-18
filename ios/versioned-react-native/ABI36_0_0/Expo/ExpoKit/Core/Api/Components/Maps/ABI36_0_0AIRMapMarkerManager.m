/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI36_0_0AIRMapMarkerManager.h"

#import <ABI36_0_0React/ABI36_0_0RCTConvert+CoreLocation.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManager.h>
#import <ABI36_0_0React/ABI36_0_0UIView+React.h>
#import "ABI36_0_0AIRMapMarker.h"

@interface ABI36_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI36_0_0AIRMapMarkerManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI36_0_0AIRMapMarker *marker = [ABI36_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI36_0_0RCTBubblingEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI36_0_0RCTDirectEventBlock)


ABI36_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI36_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI36_0_0ReactTag];
        if (![view isKindOfClass:[ABI36_0_0AIRMapMarker class]]) {
            ABI36_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI36_0_0AIRMap, got: %@", view);
        } else {
            [(ABI36_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI36_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI36_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI36_0_0ReactTag];
        if (![view isKindOfClass:[ABI36_0_0AIRMapMarker class]]) {
            ABI36_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI36_0_0AIRMap, got: %@", view);
        } else {
            [(ABI36_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI36_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI36_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI36_0_0ReactTag];
        if (![view isKindOfClass:[ABI36_0_0AIRMapMarker class]]) {
            ABI36_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI36_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
