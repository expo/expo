//
//  AIRGoogleMapMarker.h
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#ifdef HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <React/RCTBridge.h>
#import "AIRGMSMarker.h"
#import "AIRGoogleMap.h"
#import "AIRGoogleMapCallout.h"
#import "AIRGoogleMapCalloutSubview.h"

@interface AIRGoogleMapMarker : UIView

@property (nonatomic, weak) RCTBridge *bridge;
@property (nonatomic, strong) AIRGoogleMapCallout *calloutView;
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, assign) CLLocationCoordinate2D coordinate;
@property (nonatomic, assign) CLLocationDegrees rotation;
@property (nonatomic, strong) AIRGMSMarker* realMarker;
@property (nonatomic, copy) RCTBubblingEventBlock onPress;
@property (nonatomic, copy) RCTDirectEventBlock onDragStart;
@property (nonatomic, copy) RCTDirectEventBlock onDrag;
@property (nonatomic, copy) RCTDirectEventBlock onDragEnd;
@property (nonatomic, copy) NSString *imageSrc;
@property (nonatomic, copy) NSString *iconSrc;
@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) NSString *subtitle;
@property (nonatomic, strong) UIColor *pinColor;
@property (nonatomic, assign) CGPoint anchor;
@property (nonatomic, assign) CGPoint calloutAnchor;
@property (nonatomic, assign) NSInteger zIndex;
@property (nonatomic, assign) double opacity;
@property (nonatomic, assign) BOOL draggable;
@property (nonatomic, assign) BOOL tappable;
@property (nonatomic, assign) BOOL tracksViewChanges;
@property (nonatomic, assign) BOOL tracksInfoWindowChanges;

- (void)showCalloutView;
- (void)hideCalloutView;
- (void)redraw;
- (UIView *)markerInfoContents;
- (UIView *)markerInfoWindow;
- (void)didTapInfoWindowOfMarker:(AIRGMSMarker *)marker;
- (void)didTapInfoWindowOfMarker:(AIRGMSMarker *)marker point:(CGPoint)point frame:(CGRect)frame;
- (void)didTapInfoWindowOfMarker:(AIRGMSMarker *)marker subview:(AIRGoogleMapCalloutSubview*)subview point:(CGPoint)point frame:(CGRect)frame;
- (void)didBeginDraggingMarker:(AIRGMSMarker *)marker;
- (void)didEndDraggingMarker:(AIRGMSMarker *)marker;
- (void)didDragMarker:(AIRGMSMarker *)marker;
@end

#endif
