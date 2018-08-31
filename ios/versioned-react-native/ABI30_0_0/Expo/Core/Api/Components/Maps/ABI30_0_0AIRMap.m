/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI30_0_0AIRMap.h"

#import <ReactABI30_0_0/ABI30_0_0RCTEventDispatcher.h>
#import <ReactABI30_0_0/UIView+ReactABI30_0_0.h>
#import "ABI30_0_0AIRMapMarker.h"
#import "ABI30_0_0AIRMapPolyline.h"
#import "ABI30_0_0AIRMapPolygon.h"
#import "ABI30_0_0AIRMapCircle.h"
#import <QuartzCore/QuartzCore.h>
#import "ABI30_0_0AIRMapUrlTile.h"
#import "ABI30_0_0AIRMapLocalTile.h"
#import "ABI30_0_0AIRMapOverlay.h"

const CLLocationDegrees ABI30_0_0AIRMapDefaultSpan = 0.005;
const NSTimeInterval ABI30_0_0AIRMapRegionChangeObserveInterval = 0.1;
const CGFloat ABI30_0_0AIRMapZoomBoundBuffer = 0.01;
const NSInteger ABI30_0_0AIRMapMaxZoomLevel = 20;


@interface MKMapView (UIGestureRecognizer)

// this tells the compiler that MKMapView actually implements this method
- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceiveTouch:(UITouch *)touch;

@end

@interface ABI30_0_0AIRMap ()

@property (nonatomic, strong) UIActivityIndicatorView *activityIndicatorView;
@property (nonatomic, assign) NSNumber *shouldZoomEnabled;
@property (nonatomic, assign) NSNumber *shouldScrollEnabled;

- (void)updateScrollEnabled;
- (void)updateZoomEnabled;

@end

@implementation ABI30_0_0AIRMap
{
    UIView *_legalLabel;
    CLLocationManager *_locationManager;
    BOOL _initialRegionSet;

    // Array to manually track ABI30_0_0RN subviews
    //
    // ABI30_0_0AIRMap implicitly creates subviews that aren't regular ABI30_0_0RN children
    // (ABI30_0_0SMCalloutView injects an overlay subview), which otherwise confuses ABI30_0_0RN
    // during component re-renders:
    // https://github.com/facebook/ReactABI30_0_0-native/blob/v0.16.0/ReactABI30_0_0/Modules/ABI30_0_0RCTUIManager.m#L657
    //
    // Implementation based on ABI30_0_0RCTTextField, another component with indirect children
    // https://github.com/facebook/ReactABI30_0_0-native/blob/v0.16.0/Libraries/Text/ABI30_0_0RCTTextField.m#L20
    NSMutableArray<UIView *> *_ReactABI30_0_0Subviews;
}

- (instancetype)init
{
    if ((self = [super init])) {
        _hasStartedRendering = NO;
        _ReactABI30_0_0Subviews = [NSMutableArray new];

        // Find Apple link label
        for (UIView *subview in self.subviews) {
            if ([NSStringFromClass(subview.class) isEqualToString:@"MKAttributionLabel"]) {
                // This check is super hacky, but the whole premise of moving around
                // Apple's internal subviews is super hacky
                _legalLabel = subview;
                break;
            }
        }

        // 3rd-party callout view for MapKit that has more options than the built-in. It's painstakingly built to
        // be identical to the built-in callout view (which has a private API)
        self.calloutView = [ABI30_0_0SMCalloutView platformCalloutView];
        self.calloutView.delegate = self;

        self.minZoomLevel = 0;
        self.maxZoomLevel = ABI30_0_0AIRMapMaxZoomLevel;
    }
    return self;
}

- (void)dealloc
{
    [_regionChangeObserveTimer invalidate];
}

-(void)addSubview:(UIView *)view {
    if([view isKindOfClass:[ABI30_0_0AIRMapMarker class]]) {
        [self addAnnotation:(id <MKAnnotation>)view];
    } else {
        [super addSubview:view];
    }
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-missing-super-calls"
- (void)insertReactABI30_0_0Subview:(id<ABI30_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex {
    // Our desired API is to pass up markers/overlays as children to the mapview component.
    // This is where we intercept them and do the appropriate underlying mapview action.
    if ([subview isKindOfClass:[ABI30_0_0AIRMapMarker class]]) {
        [self addAnnotation:(id <MKAnnotation>) subview];
    } else if ([subview isKindOfClass:[ABI30_0_0AIRMapPolyline class]]) {
        ((ABI30_0_0AIRMapPolyline *)subview).map = self;
        [self addOverlay:(id<MKOverlay>)subview];
    } else if ([subview isKindOfClass:[ABI30_0_0AIRMapPolygon class]]) {
        ((ABI30_0_0AIRMapPolygon *)subview).map = self;
        [self addOverlay:(id<MKOverlay>)subview];
    } else if ([subview isKindOfClass:[ABI30_0_0AIRMapCircle class]]) {
        ((ABI30_0_0AIRMapCircle *)subview).map = self;
        [self addOverlay:(id<MKOverlay>)subview];
    } else if ([subview isKindOfClass:[ABI30_0_0AIRMapUrlTile class]]) {
        ((ABI30_0_0AIRMapUrlTile *)subview).map = self;
        [self addOverlay:(id<MKOverlay>)subview];
    } else if ([subview isKindOfClass:[ABI30_0_0AIRMapLocalTile class]]) {
        ((ABI30_0_0AIRMapLocalTile *)subview).map = self;
        [self addOverlay:(id<MKOverlay>)subview];
    } else if ([subview isKindOfClass:[ABI30_0_0AIRMapOverlay class]]) {
        ((ABI30_0_0AIRMapOverlay *)subview).map = self;
        [self addOverlay:(id<MKOverlay>)subview];
    } else {
        NSArray<id<ABI30_0_0RCTComponent>> *childSubviews = [subview ReactABI30_0_0Subviews];
        for (int i = 0; i < childSubviews.count; i++) {
          [self insertReactABI30_0_0Subview:(UIView *)childSubviews[i] atIndex:atIndex];
        }
    }
    [_ReactABI30_0_0Subviews insertObject:(UIView *)subview atIndex:(NSUInteger) atIndex];
}
#pragma clang diagnostic pop

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-missing-super-calls"
- (void)removeReactABI30_0_0Subview:(id<ABI30_0_0RCTComponent>)subview {
    // similarly, when the children are being removed we have to do the appropriate
    // underlying mapview action here.
    if ([subview isKindOfClass:[ABI30_0_0AIRMapMarker class]]) {
        [self removeAnnotation:(id<MKAnnotation>)subview];
    } else if ([subview isKindOfClass:[ABI30_0_0AIRMapPolyline class]]) {
        [self removeOverlay:(id <MKOverlay>) subview];
    } else if ([subview isKindOfClass:[ABI30_0_0AIRMapPolygon class]]) {
        [self removeOverlay:(id <MKOverlay>) subview];
    } else if ([subview isKindOfClass:[ABI30_0_0AIRMapCircle class]]) {
        [self removeOverlay:(id <MKOverlay>) subview];
    } else if ([subview isKindOfClass:[ABI30_0_0AIRMapUrlTile class]]) {
        [self removeOverlay:(id <MKOverlay>) subview];
    } else if ([subview isKindOfClass:[ABI30_0_0AIRMapLocalTile class]]) {
        [self removeOverlay:(id <MKOverlay>) subview];
    } else if ([subview isKindOfClass:[ABI30_0_0AIRMapOverlay class]]) {
        [self removeOverlay:(id <MKOverlay>) subview];
    } else {
        NSArray<id<ABI30_0_0RCTComponent>> *childSubviews = [subview ReactABI30_0_0Subviews];
        for (int i = 0; i < childSubviews.count; i++) {
          [self removeReactABI30_0_0Subview:(UIView *)childSubviews[i]];
        }
    }
    [_ReactABI30_0_0Subviews removeObject:(UIView *)subview];
}
#pragma clang diagnostic pop

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-missing-super-calls"
- (NSArray<id<ABI30_0_0RCTComponent>> *)ReactABI30_0_0Subviews {
  return _ReactABI30_0_0Subviews;
}
#pragma clang diagnostic pop

#pragma mark Overrides for Callout behavior

// override UIGestureRecognizer's delegate method so we can prevent MKMapView's recognizer from firing
// when we interact with UIControl subclasses inside our callout view.
- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceiveTouch:(UITouch *)touch {
    if ([touch.view isDescendantOfView:self.calloutView])
        return NO;
    else
        return [super gestureRecognizer:gestureRecognizer shouldReceiveTouch:touch];
}

// Allow touches to be sent to our calloutview.
// See this for some discussion of why we need to override this: https://github.com/nfarina/calloutview/pull/9
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {

    UIView *calloutMaybe = [self.calloutView hitTest:[self.calloutView convertPoint:point fromView:self] withEvent:event];
    if (calloutMaybe) return calloutMaybe;

    return [super hitTest:point withEvent:event];
}

#pragma mark ABI30_0_0SMCalloutViewDelegate

- (NSTimeInterval)calloutView:(ABI30_0_0SMCalloutView *)calloutView delayForRepositionWithSize:(CGSize)offset {

    // When the callout is being asked to present in a way where it or its target will be partially offscreen, it asks us
    // if we'd like to reposition our surface first so the callout is completely visible. Here we scroll the map into view,
    // but it takes some math because we have to deal in lon/lat instead of the given offset in pixels.

    CLLocationCoordinate2D coordinate = self.region.center;

    // where's the center coordinate in terms of our view?
    CGPoint center = [self convertCoordinate:coordinate toPointToView:self];

    // move it by the requested offset
    center.x -= offset.width;
    center.y -= offset.height;

    // and translate it back into map coordinates
    coordinate = [self convertPoint:center toCoordinateFromView:self];

    // move the map!
    [self setCenterCoordinate:coordinate animated:YES];

    // tell the callout to wait for a while while we scroll (we assume the scroll delay for MKMapView matches UIScrollView)
    return kSMCalloutViewRepositionDelayForUIScrollView;
}

#pragma mark Accessors

- (void)setShowsUserLocation:(BOOL)showsUserLocation
{
    if (self.showsUserLocation != showsUserLocation) {
        if (showsUserLocation && !_locationManager) {
            _locationManager = [CLLocationManager new];
            if ([_locationManager respondsToSelector:@selector(requestWhenInUseAuthorization)]) {
                [_locationManager requestWhenInUseAuthorization];
            }
        }
        super.showsUserLocation = showsUserLocation;
    }
}

- (void)setFollowsUserLocation:(BOOL)followsUserLocation
{
    _followUserLocation = followsUserLocation;
}

- (void)setHandlePanDrag:(BOOL)handleMapDrag {
    for (UIGestureRecognizer *recognizer in [self gestureRecognizers]) {
        if ([recognizer isKindOfClass:[UIPanGestureRecognizer class]]) {
            recognizer.enabled = handleMapDrag;
            break;
        }
    }
}

- (void)setRegion:(MKCoordinateRegion)region animated:(BOOL)animated
{
    // If location is invalid, abort
    if (!CLLocationCoordinate2DIsValid(region.center)) {
        return;
    }

    // If new span values are nil, use old values instead
    if (!region.span.latitudeDelta) {
        region.span.latitudeDelta = self.region.span.latitudeDelta;
    }
    if (!region.span.longitudeDelta) {
        region.span.longitudeDelta = self.region.span.longitudeDelta;
    }

    // Animate/move to new position
    [super setRegion:region animated:animated];
}

- (void)setInitialRegion:(MKCoordinateRegion)initialRegion {
    if (!_initialRegionSet) {
        _initialRegionSet = YES;
        [self setRegion:initialRegion animated:NO];
    }
}

- (void)setCacheEnabled:(BOOL)cacheEnabled {
    _cacheEnabled = cacheEnabled;
    if (self.cacheEnabled && self.cacheImageView.image == nil) {
        self.loadingView.hidden = NO;
        [self.activityIndicatorView startAnimating];
    }
    else {
        if (_loadingView != nil) {
            self.loadingView.hidden = YES;
        }
    }
}

- (void)setLoadingEnabled:(BOOL)loadingEnabled {
    _loadingEnabled = loadingEnabled;
    if (!self.hasShownInitialLoading) {
        self.loadingView.hidden = !self.loadingEnabled;
    }
    else {
        if (_loadingView != nil) {
            self.loadingView.hidden = YES;
        }
    }
}

- (UIColor *)loadingBackgroundColor {
    return self.loadingView.backgroundColor;
}

- (void)setLoadingBackgroundColor:(UIColor *)loadingBackgroundColor {
    self.loadingView.backgroundColor = loadingBackgroundColor;
}

- (UIColor *)loadingIndicatorColor {
    return self.activityIndicatorView.color;
}

- (void)setLoadingIndicatorColor:(UIColor *)loadingIndicatorColor {
    self.activityIndicatorView.color = loadingIndicatorColor;
}

// Include properties of MKMapView which are only available on iOS 9+
// and check if their selector is available before calling super method.

- (void)setShowsCompass:(BOOL)showsCompass {
    if ([MKMapView instancesRespondToSelector:@selector(setShowsCompass:)]) {
        [super setShowsCompass:showsCompass];
    }
}

- (BOOL)showsCompass {
    if ([MKMapView instancesRespondToSelector:@selector(showsCompass)]) {
        return [super showsCompass];
    } else {
        return NO;
    }
}

- (void)setShowsScale:(BOOL)showsScale {
    if ([MKMapView instancesRespondToSelector:@selector(setShowsScale:)]) {
        [super setShowsScale:showsScale];
    }
}

- (BOOL)showsScale {
    if ([MKMapView instancesRespondToSelector:@selector(showsScale)]) {
        return [super showsScale];
    } else {
        return NO;
    }
}

- (void)setShowsTraffic:(BOOL)showsTraffic {
    if ([MKMapView instancesRespondToSelector:@selector(setShowsTraffic:)]) {
        [super setShowsTraffic:showsTraffic];
    }
}

- (BOOL)showsTraffic {
    if ([MKMapView instancesRespondToSelector:@selector(showsTraffic)]) {
        return [super showsTraffic];
    } else {
        return NO;
    }
}

- (void)setScrollEnabled:(BOOL)scrollEnabled {
    self.shouldScrollEnabled = [NSNumber numberWithBool:scrollEnabled];
    [self updateScrollEnabled];
}

- (void)updateScrollEnabled {
    if (self.cacheEnabled) {
        [super setScrollEnabled:NO];
    }
    else if (self.shouldScrollEnabled != nil) {
        [super setScrollEnabled:[self.shouldScrollEnabled boolValue]];
    }
}

- (void)setZoomEnabled:(BOOL)zoomEnabled {
    self.shouldZoomEnabled = [NSNumber numberWithBool:zoomEnabled];
    [self updateZoomEnabled];
}

- (void)updateZoomEnabled {
    if (self.cacheEnabled) {
        [super setZoomEnabled: NO];
    }
    else if (self.shouldZoomEnabled != nil) {
        [super setZoomEnabled:[self.shouldZoomEnabled boolValue]];
    }
}

- (void)cacheViewIfNeeded {
    if (self.hasShownInitialLoading) {
        if (!self.cacheEnabled) {
            if (_cacheImageView != nil) {
                self.cacheImageView.hidden = YES;
                self.cacheImageView.image = nil;
            }
        }
        else {
            self.cacheImageView.image = nil;
            self.cacheImageView.hidden = YES;

            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.01 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                self.cacheImageView.image = nil;
                self.cacheImageView.hidden = YES;
                UIGraphicsBeginImageContextWithOptions(self.bounds.size, self.opaque, 0.0);
                [self.layer renderInContext:UIGraphicsGetCurrentContext()];
                UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
                UIGraphicsEndImageContext();

                self.cacheImageView.image = image;
                self.cacheImageView.hidden = NO;
            });
        }

        [self updateScrollEnabled];
        [self updateZoomEnabled];
        [self updateLegalLabelInsets];
    }
}

- (void)updateLegalLabelInsets {
    if (_legalLabel) {
        dispatch_async(dispatch_get_main_queue(), ^{
            CGRect frame = self->_legalLabel.frame;
            if (self->_legalLabelInsets.left) {
                frame.origin.x = self->_legalLabelInsets.left;
            } else if (self->_legalLabelInsets.right) {
                frame.origin.x = self.frame.size.width - self->_legalLabelInsets.right - frame.size.width;
            }
            if (self->_legalLabelInsets.top) {
                frame.origin.y = self->_legalLabelInsets.top;
            } else if (self->_legalLabelInsets.bottom) {
                frame.origin.y = self.frame.size.height - self->_legalLabelInsets.bottom - frame.size.height;
            }
            self->_legalLabel.frame = frame;
        });
    }
}


- (void)setLegalLabelInsets:(UIEdgeInsets)legalLabelInsets {
  _legalLabelInsets = legalLabelInsets;
  [self updateLegalLabelInsets];
}

- (void)beginLoading {
    if ((!self.hasShownInitialLoading && self.loadingEnabled) || (self.cacheEnabled && self.cacheImageView.image == nil)) {
        self.loadingView.hidden = NO;
        [self.activityIndicatorView startAnimating];
    }
    else {
        if (_loadingView != nil) {
            self.loadingView.hidden = YES;
        }
    }
}

- (void)finishLoading {
    self.hasShownInitialLoading = YES;
    if (_loadingView != nil) {
        self.loadingView.hidden = YES;
    }
    [self cacheViewIfNeeded];
}

- (UIActivityIndicatorView *)activityIndicatorView {
    if (_activityIndicatorView == nil) {
        _activityIndicatorView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleGray];
        _activityIndicatorView.center = self.loadingView.center;
        _activityIndicatorView.autoresizingMask = UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin | UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
        _activityIndicatorView.color = [UIColor colorWithRed:96.f/255.f green:96.f/255.f blue:96.f/255.f alpha:1.f]; // defaults to #606060
    }
    [self.loadingView addSubview:_activityIndicatorView];
    return _activityIndicatorView;
}

- (UIView *)loadingView {
    if (_loadingView == nil) {
        _loadingView = [[UIView alloc] initWithFrame:self.bounds];
        _loadingView.autoresizingMask = UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight;
        _loadingView.backgroundColor = [UIColor whiteColor]; // defaults to #FFFFFF
        [self addSubview:_loadingView];
        _loadingView.hidden = NO;
    }
    return _loadingView;
}

- (UIImageView *)cacheImageView {
    if (_cacheImageView == nil) {
        _cacheImageView = [[UIImageView alloc] initWithFrame:self.bounds];
        _cacheImageView.contentMode = UIViewContentModeCenter;
        _cacheImageView.autoresizingMask = UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight;
        [self addSubview:self.cacheImageView];
        _cacheImageView.hidden = YES;
    }
    return _cacheImageView;
}

- (void)layoutSubviews {
    [super layoutSubviews];
    [self cacheViewIfNeeded];
}

@end
