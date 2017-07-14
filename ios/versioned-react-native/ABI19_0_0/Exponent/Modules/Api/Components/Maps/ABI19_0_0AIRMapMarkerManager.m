/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0AIRMapMarkerManager.h"

#import <ReactABI19_0_0/ABI19_0_0RCTConvert+CoreLocation.h>
#import <ReactABI19_0_0/ABI19_0_0RCTUIManager.h>
#import <ReactABI19_0_0/UIView+ReactABI19_0_0.h>
#import "ABI19_0_0AIRMapMarker.h"

@interface ABI19_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI19_0_0AIRMapMarkerManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI19_0_0AIRMapMarker *marker = [ABI19_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI19_0_0RCTBubblingEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI19_0_0RCTDirectEventBlock)


ABI19_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI19_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI19_0_0Tag];
        if (![view isKindOfClass:[ABI19_0_0AIRMapMarker class]]) {
            ABI19_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI19_0_0AIRMap, got: %@", view);
        } else {
            [(ABI19_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI19_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI19_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI19_0_0Tag];
        if (![view isKindOfClass:[ABI19_0_0AIRMapMarker class]]) {
            ABI19_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI19_0_0AIRMap, got: %@", view);
        } else {
            [(ABI19_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
