//
//  ABI23_0_0AIRGoogleMapMarker.h
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import "ABI23_0_0AIRGMSMarker.h"
#import "ABI23_0_0AIRGoogleMap.h"
#import "ABI23_0_0AIRGoogleMapCallout.h"

@interface ABI23_0_0AIRGoogleMapMarker : UIView

@property (nonatomic, weak) ABI23_0_0RCTBridge *bridge;
@property (nonatomic, strong) ABI23_0_0AIRGoogleMapCallout *calloutView;
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, assign) CLLocationCoordinate2D coordinate;
@property (nonatomic, strong) ABI23_0_0AIRGMSMarker* realMarker;
@property (nonatomic, copy) ABI23_0_0RCTBubblingEventBlock onPress;
@property (nonatomic, copy) ABI23_0_0RCTDirectEventBlock onDragStart;
@property (nonatomic, copy) ABI23_0_0RCTDirectEventBlock onDrag;
@property (nonatomic, copy) ABI23_0_0RCTDirectEventBlock onDragEnd;
@property (nonatomic, copy) NSString *imageSrc;
@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) NSString *subtitle;
@property (nonatomic, strong) UIColor *pinColor;
@property (nonatomic, assign) CGPoint anchor;
@property (nonatomic, assign) NSInteger zIndex;
@property (nonatomic, assign) double opacity;
@property (nonatomic, assign) BOOL draggable;

- (void)showCalloutView;
- (void)hideCalloutView;
- (UIView *)markerInfoContents;
- (UIView *)markerInfoWindow;
- (void)didTapInfoWindowOfMarker:(ABI23_0_0AIRGMSMarker *)marker;
- (void)didBeginDraggingMarker:(ABI23_0_0AIRGMSMarker *)marker;
- (void)didEndDraggingMarker:(ABI23_0_0AIRGMSMarker *)marker;
- (void)didDragMarker:(ABI23_0_0AIRGMSMarker *)marker;
@end
