//
//  GMSPanoramaView.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <CoreLocation/CoreLocation.h>
#import <UIKit/UIKit.h>

#import "GMSOrientation.h"
#import "GMSPanoramaLayer.h"
#import "GMSPanoramaSource.h"

@class GMSMarker;
@class GMSPanorama;
@class GMSPanoramaCamera;
@class GMSPanoramaCameraUpdate;
@class GMSPanoramaView;

NS_ASSUME_NONNULL_BEGIN

/** Delegate for events on GMSPanoramaView. */
@protocol GMSPanoramaViewDelegate<NSObject>
@optional

/**
 * Called when starting a move to another panorama.
 *
 * This can be the result of interactive navigation to a neighbouring panorama.
 *
 * At the moment this method is called, the |view|.panorama is still pointing to the old panorama,
 * as the new panorama identified by |panoID| is not yet resolved. panoramaView:didMoveToPanorama:
 * will be called when the new panorama is ready.
 */
- (void)panoramaView:(GMSPanoramaView *)view willMoveToPanoramaID:(NSString *)panoramaID;

/**
 * This is invoked every time the |view|.panorama property changes.
 */
- (void)panoramaView:(GMSPanoramaView *)view
    didMoveToPanorama:(nullable GMSPanorama *)panorama;

/**
 * Called when the panorama change was caused by invoking moveToPanoramaNearCoordinate:. The
 * coordinate passed to that method will also be passed here.
 */
- (void)panoramaView:(GMSPanoramaView *)view
    didMoveToPanorama:(GMSPanorama *)panorama
       nearCoordinate:(CLLocationCoordinate2D)coordinate;

/**
 * Called when moveNearCoordinate: produces an error.
 */
- (void)panoramaView:(GMSPanoramaView *)view
                   error:(NSError *)error
    onMoveNearCoordinate:(CLLocationCoordinate2D)coordinate;

/**
 * Called when moveToPanoramaID: produces an error.
 */
- (void)panoramaView:(GMSPanoramaView *)view
                 error:(NSError *)error
    onMoveToPanoramaID:(NSString *)panoramaID;

/**
 * Called repeatedly during changes to the camera on GMSPanoramaView. This may not be called for all
 * intermediate camera values, but is always called for the final position of the camera after an
 * animation or gesture.
 */
- (void)panoramaView:(GMSPanoramaView *)panoramaView didMoveCamera:(GMSPanoramaCamera *)camera;

/**
 * Called when a user has tapped on the GMSPanoramaView, but this tap was not consumed (taps may be
 * consumed by e.g., tapping on a navigation arrow).
 */
- (void)panoramaView:(GMSPanoramaView *)panoramaView didTap:(CGPoint)point;

/**
 * Called after a marker has been tapped.  May return YES to indicate the event has been fully
 * handled and suppress any default behavior.
 */
- (BOOL)panoramaView:(GMSPanoramaView *)panoramaView didTapMarker:(GMSMarker *)marker;

/**
 * Called when the panorama tiles for the current view have just been requested and are beginning to
 * load.
 */
- (void)panoramaViewDidStartRendering:(GMSPanoramaView *)panoramaView;

/**
 * Called when the panorama tiles have been loaded (or permanently failed to load) and rendered on
 * screen.
 */
- (void)panoramaViewDidFinishRendering:(GMSPanoramaView *)panoramaView;

@end

/**
 * A panorama is used to display Street View imagery. It should be constructed via [[GMSPanoramaView
 * alloc] initWithFrame:], and configured post-initialization.
 *
 * All properties and methods should be accessed on the main thread, similar to all UIKit objects.
 * The GMSPanoramaViewDelegate methods will also be called back only on the main thread.
 *
 * The backgroundColor of this view is shown while no panorama is visible, such as while it is
 * loading or if the panorama is later set to nil. The alpha color of backgroundColor is not
 * supported.
 */
@interface GMSPanoramaView : UIView

/**
 * The panorama to display; setting it will transition to a new panorama. This is animated, except
 * for the initial panorama.
 *
 * Can be set to nil to clear the view.
 */
@property(nonatomic, strong, nullable) GMSPanorama *panorama;

/** GMSPanoramaView delegate. */
@property(nonatomic, weak, nullable) IBOutlet id<GMSPanoramaViewDelegate> delegate;

/**
 * Sets the preference for whether all gestures should be enabled (default) or disabled.
 *
 * This does not limit programmatic movement of the camera or control of the panorama.
 */
- (void)setAllGesturesEnabled:(BOOL)enabled;

/**
 * Controls whether orientation gestures are enabled (default) or disabled. If enabled, users may
 * use gestures to change the orientation of the camera.
 *
 * This does not limit programmatic movement of the camera.
 */
@property(nonatomic, assign) BOOL orientationGestures;

/**
 * Controls whether zoom gestures are enabled (default) or disabled. If enabled, users may pinch to
 * zoom the camera.
 *
 * This does not limit programmatic movement of the camera.
 */
@property(nonatomic, assign) BOOL zoomGestures;

/**
 * Controls whether navigation gestures are enabled (default) or disabled. If enabled, users may use
 * a single tap on navigation links or double tap the view to change panoramas.
 *
 * This does not limit programmatic control of the panorama.
 */
@property(nonatomic, assign) BOOL navigationGestures;

/**
 * Controls whether the tappable navigation links are hidden or visible (default). Hidden navigation
 * links cannot be tapped.
 */
@property(nonatomic, assign) BOOL navigationLinksHidden;

/**
 * Controls whether the street name overlays are hidden or visible (default).
 */
@property(nonatomic, assign) BOOL streetNamesHidden;

/**
 * Controls the panorama's camera. Setting a new camera here jumps to the new camera value, with no
 * animation.
 */
@property(nonatomic, strong) GMSPanoramaCamera *camera;

/**
 * Accessor for the custom CALayer type used for the layer.
 */
@property(nonatomic, readonly, retain) GMSPanoramaLayer *layer;

/**
 * Animates the camera of this GMSPanoramaView to |camera|, over |duration| (specified in seconds).
 */
- (void)animateToCamera:(GMSPanoramaCamera *)camera animationDuration:(NSTimeInterval)duration;

/**
 * Modifies the camera according to |cameraUpdate|, over |duration| (specified in seconds).
 */
- (void)updateCamera:(GMSPanoramaCameraUpdate *)cameraUpdate
   animationDuration:(NSTimeInterval)duration;

/**
 * Requests a panorama near |coordinate|.
 *
 * Upon successful completion panoramaView:didMoveToPanorama: and
 * panoramaView:didMoveToPanorama:nearCoordinate: will be sent to GMSPanoramaViewDelegate.
 *
 * On error panoramaView:error:onMoveNearCoordinate: will be sent.
 *
 * Repeated calls to moveNearCoordinate: result in the previous pending (incomplete) transitions
 * being cancelled -- only the most recent of moveNearCoordinate: and moveToPanoramaId: will proceed
 * and generate events.
 */
- (void)moveNearCoordinate:(CLLocationCoordinate2D)coordinate;

/**
 * Similar to moveNearCoordinate: but allows specifying a search radius (meters) around
 * |coordinate|.
 */
- (void)moveNearCoordinate:(CLLocationCoordinate2D)coordinate radius:(NSUInteger)radius;

/**
 * Similar to moveNearCoordinate: but allows specifying a source near |coordinate|.
 *
 * This API is experimental and may not always filter by source.
 */
- (void)moveNearCoordinate:(CLLocationCoordinate2D)coordinate source:(GMSPanoramaSource)source;

/**
 * Similar to moveNearCoordinate: but allows specifying a search radius (meters) around
 * |coordinate| and a source.
 *
 * This API is experimental and may not always filter by source.
 */
- (void)moveNearCoordinate:(CLLocationCoordinate2D)coordinate
                    radius:(NSUInteger)radius
                    source:(GMSPanoramaSource)source;

/**
 * Requests a panorama with |panoramaID|.
 *
 * Upon successful completion panoramaView:didMoveToPanorama: will be sent to
 * GMSPanoramaViewDelegate.
 *
 * On error panoramaView:error:onMoveToPanoramaID: will be sent.
 *
 * Repeated calls to moveToPanoramaID: result in the previous pending (incomplete) transitions being
 * cancelled -- only the most recent of moveNearCoordinate: and moveToPanoramaId: will proceed and
 * generate events.
 *
 * Only panoramaIDs obtained from the Google Maps SDK for iOS are supported.
 */
- (void)moveToPanoramaID:(NSString *)panoramaID;

/**
 * For the current view, returns the screen point the |orientation| points through.  This value may
 * be outside the view for forward facing orientations which are far enough away from straight
 * ahead.
 *
 * The result will contain NaNs for camera orientations which point away from the view, where the
 * implied screen point would have had a negative distance from the camera in the direction of
 * orientation.
 */
- (CGPoint)pointForOrientation:(GMSOrientation)orientation;

/**
 * Given a point for this view, returns the current camera orientation pointing through that screen
 * location.  At the center of this view, the returned GMSOrientation will be approximately equal to
 * that of the current GMSPanoramaCamera.
 */
- (GMSOrientation)orientationForPoint:(CGPoint)point;

/**
 * Convenience constructor for GMSPanoramaView, which searches for and displays a GMSPanorama near
 * |coordinate|. This performs a similar action to that of moveNearCoordinate:, and will call the
 * same delegate methods.
 */
+ (instancetype)panoramaWithFrame:(CGRect)frame nearCoordinate:(CLLocationCoordinate2D)coordinate;

/**
 * Similar to panoramaWithFrame:nearCoordinate: but allows specifying a search radius (meters)
 * around |coordinate|.
 */
+ (instancetype)panoramaWithFrame:(CGRect)frame
                   nearCoordinate:(CLLocationCoordinate2D)coordinate
                           radius:(NSUInteger)radius;

/**
 * Convenience constructor for GMSPanoramaView, which searches for and displays a GMSPanorama near
 * |coordinate|. This performs a similar action to that of moveNearCoordinate:source, and will call
 * the same delegate methods.
 *
 * This API is experimental and may not always filter by source.
 */
+ (instancetype)panoramaWithFrame:(CGRect)frame
                   nearCoordinate:(CLLocationCoordinate2D)coordinate
                           source:(GMSPanoramaSource)source;
/**
 * Convenience constructor for GMSPanoramaView, which searches for and displays a GMSPanorama near
 * |coordinate|. This performs a similar action to that of moveNearCoordinate:radius:source, and
 * will call the same delegate methods.
 *
 * This API is experimental and may not always filter by source.
 */
+ (instancetype)panoramaWithFrame:(CGRect)frame
                   nearCoordinate:(CLLocationCoordinate2D)coordinate
                           radius:(NSUInteger)radius
                           source:(GMSPanoramaSource)source;

@end

NS_ASSUME_NONNULL_END
