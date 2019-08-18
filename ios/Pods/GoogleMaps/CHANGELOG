Version 2.5.0 - October 2017
============================
Features:
  - Added the paddingAdjustmentBehavior property to GMSMapView. This property
    controls how safe area insets interact with padding.

Improvements:
  - Improved iOS 11 & iPhone X support.
  - GMSMapView and GMSPanoramaView managed subviews are now positioned within
    iPhone X device safe areas by default.

Resolved Issues:
  - Fixed an issue where Xcode 9's Main Thread Checker warns that [UIApplication
    applicationState] is being called on a background thread.
  - Fixed an issue where setting either navigationLinksHidden or
    streetNamesHidden to YES still resulted in the navigation links and street
    names appearing.

Note:
  - Support for Xcode 7.3 has been dropped. The new minimum is Xcode 8.0.

Version 2.4.0 - August 2017
===========================
Note:
  - The armv7s architecture in the frameworks has been removed. Devices which
    previously used armv7s are still supported using the armv7 architecture.
    All applications using the default architecture settings in any supported
    version of Xcode should not notice any change.
  - The layout of the static frameworks has changed. There is no longer a
    Versions directory. The contents of Versions/A has been moved to the root
    directory of the framework. Developers who manually integrate frameworks
    with their project should take additional care during the upgrade.
  - Support for Xcode 7.3 will be dropped with 2.5.0.

Resolved Issues:
  - Addressed a crash when using GMSPanoramaView with an application moving to
    the background state.

Version 2.3.1 - June 2017
========================
Resolved Issues:
  - Fixed an issue where navigating between panoramas did not consistently raise
    GMSPanoramaView delegate events.
  - Fixed an issue resulting in a crash when UIWebView and GMSPanoramaView are
    both in the view hierarchy at the same time.
  - Reinstated the tap-drag zoom gesture for GMSPanoramaView.

Version 2.3.0 - May 2017
========================
Improvements:
  - The internals of the GMSPanoramaView and associated classes have had a
    significant overhaul. These changes should generally give improved
    performance.
  - Dropped support for iOS 7, which enabled the use of modern core data
    threading models. This means that applications should be able to use
    -com.apple.CoreData.ConcurrencyDebug 1 when debugging with iOS 10 devices.

Resolved Issues:
  - Fixed case sensitivity issues with imports in GMSTileLayer.h and
    GMSPolyline.h.

Note:
  - The armv7s architecture in the frameworks will be removed in 2.4. Devices
    which previously used armv7s can continue to be supported using the armv7
    architecture. All applications using the default architecture settings
    in any supported version of Xcode shouldn't notice any change.

Version 2.2.0 - February 2017
=============================
Features:
  - Added the `cameraTargetBounds` property to `GMSMapView`.
    This property restricts the camera target to the specified bounds area.
    Subsequent gestures are then also restricted to keep the camera target
    within the specified bounds.
  - The `userData` property of `GMSMarker` was moved to its parent class
    `GMSOverlay`. This enables the property to be used with the `GMSPolyline`,
    `GMSPolygon`, `GMSCircle`, and `GMSGroundOverlay` classes.

Improvements:
  - Fixes naming of certain enum cases in Swift. The following enums are
    affected:  `GMSMapViewType`, `GMSFrameRate`, `GMSMarkerAnimation`, and
    `GMSLengthKind`.

Resolved Issues:
  - Fixed an issue where the `mapViewSnapshotReady` delegate method was
    sometimes raised too early.

Note:
  - iOS 7 support is intended to be dropped starting with 2.3. 2.2.x will be
    the last release series to support iOS 7.

Version 2.1.1 - November 2016
=============================
Resolved Issues:
  - Fixed an issue which caused many Road Shields to not be displayed when
    custom styling is active even if the custom styling didn't attempt to style
    them.
  - Renamed some symbols which could cause duplicate symbols when using all_load
    and Firebase.
  - Resolved a problem where changing any property of polygon, polyline or
    ground overlay in between taps would cause tap cycling to break.  This could
    make it seem impossible to tap through to items underneath.
  - Fixed cameraForBounds:insets: to respect the currently set min and max zoom
    restrictions.

Version 2.1.0 - September 2016
==============================
Features:
  - This release introduces custom styling of the base map. You can use a JSON
    style declaration to create a `GMSMapStyle` instance and pass it to the
    `mapStyle` property, to change the visual display of features like roads,
    parks, businesses, and other points of interest. You can use styling to
    emphasize particular components of the map, or make the map complement the
    style of your app. Styling works only on the `kGMSTypeNormal` map type.
  - It is now possible to apply "night mode" to maps, by applying custom styles.
  - Business points of interest (POIs) now appear by default on the map,
    provided that the map type is `kGMSTypeNormal`. Prior to this release,
    local POIs appeared on the map, but not business POIs). Business POIs
    represent businesses such as shops, restaurants, hotels, and more.
  - You can disable POIs on a map by using map styling.
  - With the addition of business points of interest, there is a new optional
    method `didTapPOIWithPlaceID` on `GMSMapViewDelegate` which provides
    notification when a POI has been tapped.

Resolved Issues:
  - Renamed the `canGoOffline` selector internally, to avoid triggering false
    positives during submission to the Apple app store.
  - The `iconView` property of `GMSMarker` is now correctly marked as nullable.
  - The renderer has been updated to avoid a race condition which would
    cause rendering to not stop in time when an app transitions to background.
  - `GMSPath` `initFromEncodedPath` now returns nil for invalid input
    (previously invalid input could result in a crash).
  - An additional method was added to `GMSMapView`, which compares two camera
    positions to determine whether they are close enough to render identically.
  - `GMSCircle` will now always draw at least a dot for small radius circles,
    including radius 0.

Version 2.0.1 - July 2016
=========================

Resolved Issues:
  - Array properties are now correctly typed when accessed from Swift.

Version 2.0.0 - July 2016
=========================

Improvements:
  - This release splits the Places API from the Maps SDK. Previously, if you
    wanted to use the Places API you had to include all of GoogleMaps. As a
    result of the split, the final size of the Places API binary is 70% smaller
    than the previous combined binary. If you are using only the Maps SDK you
    will not be affected unless you have pinned your dependency on GoogleMaps
    to a version earlier than 2.0. In this case, you should update this
    restriction in your Podfile. If you are using the Places API, see the
    migration guide online for more details.

Resolved Issues:
  - The GoogleMaps binary has been reduced to less than 100MB to avoid
    exceeding GitHub's file size limit.
  - GMSGroundOverlays now correctly respond to touch input when rotated.
  - Marker info windows now render consistently.
  - Info windows created using the return value of mapView:markerInfoContents:
    will now correctly respect the height of the returned content rather than
    always being square based on the width.
  - Fixed an issue where texture cache limit is exceeded on devices supporting
    @3x sized images.

Version 1.13.2 - May 2016
=========================
Resolved Issues:
  - Added a workaround to avoid the false positive for the non-public API
    imageWithName: selector.

Version 1.13.1 - May 2016
=========================
Resolved Issues:
  - Fixed an application hang when using a UIView with autolayout enabled as an info
    window or as a marker iconView.
  - Changed lookUpPlaceID to not call its callback twice in error scenarios.

Version 1.13.0 - March 2016
===========================
Features:
  - UIView based markers. Marker content can now show advanced animations by
    providing a custom view hierarchy to be displayed through the iconView property.
  - Info windows can now have their custom views animated. Set tracksInfoWindowChanges
    on the associated marker to YES to enable real-time updates.
  - Map rendering now defaults to 60fps on modern iOS devices. Set the new
    preferredFrameRate property on GMSMapView to revert to the old behavior
    (Conservative) or a new low frame rate option to save battery (PowerSave).
  - Added mapViewSnapshotReady: to GMSMapViewDelegate which fires when map content,
    including markers and other overlays, has been fully rendered.
  - Autocomplete widgets in the Places API now provide options for custom styling.

Resolved Issues:
  - GMSCoordinateBounds initWithVisibleRegion: now chooses correct bounds for large
    viewports.
  - Added a workaround to avoid a graphical glitch in snapshots taken using pre iOS 7
    methods when the My Location button is disabled.
  - GMSAutocompleteViewController now works when used in a storyboard.
  - Added missing Place Type constants.

Version 1.12.3 - February 2016
==============================
Resolved Issues:
  - Fixed corruption in included bitcode that caused Xcode archive action to fail.
  - Workaround limitation in Xcode 6.4 which was failing to compile included headers.

Version 1.12.2 - February 2016
==============================
Features:
  - Added place photos to the Places API.
  - Added structured address components to GMSPlace objects.
  - SDK method signatures have been updated with generics and nullability annotations.

Resolved Issues:
  - GMSPlace objects now contain rating and price level where available.
  - Minor bugfixes for the autocomplete widget UI.
  - panoramaView:didMoveCamera: is no longer raised during the panoramaView delegate
    setter.
  - Old unused logo files have been removed from the SDK.
  - Tap events on polygons near the anti-meridian are more reliable.
  - Resolved an issue resulting in unrecognized selector crashes when calling
    class methods on categories.

Version 1.12.1 - February 2016
==============================

This version is exactly the same as 1.11.1. It was released to replace the
removed 1.12.0 release.

Version 1.12.0 - February 2016
==============================

This version was removed because of errors in the framework and should not be
used.

Version 1.11.1 - December 2015
==============================
Resolved Issues:
  - Modally presented Place Autocomplete widgets now correctly respect
    UINavigationBar appearance proxy settings.
  - Resolved minor UI issues with the Place Autocomplete widgets.
  - Updated GoogleMaps.bundle info.plist to avoid triggering checks in
    pre-submission verification.

Version 1.11.0 - December 2015
==============================
Features:
  - Bitcode is now included in the SDK binary for all device architectures.
  - Added Place Autocomplete widget classes.
  - New events for long press on an info window, and closing an info window, have
    been added to GMSMapViewDelegate.
  - GMSMapViewDelegate has new events to indicate when map tiles and labels are
    pending and finished rendering.
  - GMSPanoramaViewDelegate has new events to indicate when panorama tiles are
    pending and finished rendering.
  - GMSGroundOverlay now supports an alpha multiplier via the opacity property.
  - Added a holes property to GMSPolygon to allow for the subtraction away from
    the filled area in order to create more complex shapes.
  - At zoom levels greater than 14, the maximum tilt has been increased.
  - Added an autocomplete screen to the Place Picker.
  - Split autocomplete predictions into primary and secondary text fields.
  - Added a country filter option to GMSAutocompleteFilter.
  - Added a viewport field to GMSPlace.

Resolved Issues:
  - Correct handling of taps on overlapping markers.
  - Address a race condition dependent crash which can happen when an application
    enters and leaves the background while showing a map.
  - Fix blank maps which can happen when launching an app into the background.
  - Workaround issues with core animation that caused markers to jump.
  - Updated to avoid subtle conflicts with applications which use
    google-toolbox-for-mac.
  - Use the iPhone language instead of the region formatting language for
    Places API results.

Notes:
  - Setting GMSMapView selectedMarker to a marker not on the map is now ignored,
    always set the marker's map property before attempting to select it.

Version 1.10.5 - October 2015
=============================
Resolved Issues:
  - Workaround an issue in the Swift compiler's handling of umbrella header
    module entries.

Version 1.10.4 - October 2015
=============================
Resolved Issues:
  - Fixed a crash on iOS 9 when dismissing the place picker without a selection.
  - Fixed a crash when using both a GMSMapView and a UIWebView or WKWebView in the view
    hierarchy at the same time.
  - Recompiled with Xcode 7 to avoid raising failed to load optimized model log messages
    on iOS 9 devices.

Version 1.10.3 - September 2015
===============================
Features:
  - Google logos have been updated.

Resolved Issues:
  - Framework now ships with the device version of bundles to pass Xcode 7 archive checks.

Version 1.10.2 - August 2015
============================
Resolved Issues:
  - Fixed a crash releasing a map view while in background.
  - Resolved a conflict with apps using gtm-session-fetcher resumable downloads.
  - Recompiled with Xcode 6.4 to avoid some bugs in Xcode 6.3 compiler.
  - Updated GoogleMaps.bundle info.plist to avoid triggering new checks in
    pre-submission verification.

Version 1.10.1 - June 2015
==========================
Resolved Issues:
  - Fixed an issue where instantiating GMSPlacesClient triggered a request to enable Bluetooth.
  - Miscellaneous improvements to the GMSPlacePicker UI.

Version 1.10.0 - May 2015
=========================
Major Feature:
  - Places API is now bundled with the Google Maps SDK for iOS.

Features:
  - New allowScrollGesturesDuringRotateOrZoom property on GMSUISettings controls whether
    the user can scroll by panning during multi-touch rotate or zoom gestures.
  - GMSPanoramaView now supports being used via storyboard.
  - GMSGeocoder now supports being used while the application is in the background.
  - GMSServices sharedServices can now be called while application is in the background. Note
    that if the first call to sharedServices is while application is in the background some
    async initialization work will be deferred until the first time a map is shown where it will
    be performed synchronously.
  - GMSMapView/GMSPanoramaView init messages can now be handled while the application is in
    background.  This should remove the last case where GMSMapView/GMSPanoramaView could not
    be used in the background.
  - GMSMapView/GMSPanormaView delegate properties now support IBOutlet for easier use via
    storyboard.

Resolved Issues:
  - mapView:didTapMyLocationButtonForMapView: is now correctly called even if no location is
    available.
  - GMSGroundOverlay now shows correctly when rotated if image aspect ratio doesn't match the
    selected ground region.
  - Fixed an issue resizing the map on iOS 8.
  - Fixed a rare crash under fast camera changes.
  - Map no longer hangs when adding a ground overlay with certain invalid bounds.
  - Fixed a crash when texture memory is exhausted by markers.
  - Correctly return the tapped GMSCircle to mapView:didTapOverlay: for tappable circles.
  - mapView:idleAtCameraPosition: will now be called even if there is an ongoing update of the
    my location dot.

Notes:
  - Due to an ABI change in the Xcode compiler, Xcode 6.3 is now the only supported version for
    compiling against Google Maps SDK for iOS.
  - The minimum target iOS version for Google Maps SDK for iOS is now 7.0.  Version 6.0 is no
    longer supported.

Version 1.9.2 - February 2015
=============================
Resolved Issues:
  - Show correct characters for Myanmar place labels.
  - Fixed small memory leak related to font registration.
  - Fixed large memory leak in rare cases where My Location is enabled and the user rotates
    the screen.
  - Correctly show ground overlays defined by zoom level which extend across >180 degrees
    of longitude.
  - Allow selected marker to be set during mapView:didTapAtCoordinate:.
  - Throw exception rather than crash when map services are initialized while application is
    in background.
  - Raise mapView:willMove: and mapView:idleAtCameraPosition: even for swipe motions which
    last less than 30ms.
  - Correctly handle animations starting while a gesture is decelerating.
  - Always return an error from GMSPanoramaService callbacks if panorama is nil.
  - Don't attempt to navigate to empty panorama if moveNearCoordinate: resolves to nil.

Version 1.9.1 - December 2014
=============================
Resolved Issues:
  - Added workaround for userEmail private selector false positive.
  - Improved handling of info windows for iPhone 6+ running applications in scaled mode.

Version 1.9.0 - October 2014
============================
Features:
  - Support for iOS 8
  - Support for iPhone 6/6+
  - Support for Swift
  - UI elements have been updated for material design

Resolved Issues:
  - Fixed some memory reclamation issues
  - Improved handling of application background state transition

Notes:
  - In order to improve compatibility with Swift, two geometry library
    functions have been renamed to avoid function overloading
    The new names are GMSGeometryIsLocationOnPathTolerance and
    GMSStyleSpansOffset

Version 1.8.1 - May 2014
========================
Resolved Issues:
  - Resolved GMSTileLayer not displaying
  - Resolved a rare case where an app would crash when displaying polylines
    while accessibility features are enabled
  - mapView:willMove: is no longer called alongside a tap gesture
  - Resolved symbol collisions with the Protocol Buffer library

Version 1.8.0 - May 2014
========================
Resolved Issues:
  - Resolved threading deadlock prominent on iPhone 4 running iOS 7.1 or later
  - GMSMapView correctly releases some shared GL state previously causing
    memory leak
  - GMSPolyline no longer crashes in some cases where its path contained more
    than 1024 segments
  - The delegate method mapView:idleAtCameraPosition: is now only called once
    all user gestures are complete
  - The Google Maps SDK for iOS now includes fonts for languages currently
    unsupported by the iOS system, such as Khmer
      - These fonts may be safely removed from your GoogleMaps.framework if you
        have no interest in these regions, but some text may render as "[?]"

Version 1.7.2 - March 2014
==========================
Resolved Issues:
  - Heading will only appear on My Location dot when available
  - Better reduction of colors on gradient or colored polylines at low zoom
  - The search radius is now respected when retrieving a GMSPanorama object
    via GMSPanoramaService and on GMSPanoramaView construction or move
  - GMSPolyline is no longer grayscale on iOS 7.1

Version 1.7.0 - February 2014
=============================
Features:
  - Styled polylines: additional color options via GMSPolyline, including
    gradients and colors per any number of polyline segments
    * Each polyline may be drawn with many GMSStyleSpan instances, configuring
      a unique color or gradient over an arbitrary number of segments
    * Gradient or color may be specified via a GMSStrokeStyle
    * GMSPath provides a helper category to determine distance along a path
    * GMSStyleSpans helper to apply repeated styles along a polyline
  - GMSGeocoder now provides structured addresses via GMSAddress, deprecating
    GMSReverseGeocodeResult
  - Added mutable version of GMSCameraPosition, GMSMutableCameraPosition
  - Delegate method for user tapping the My Location button
  - Added GMSMapPoint for linear interpolation between points in Mercator space
    on the Earth
  - My Location dot now shows compass arrow
  - 3D building data at many places on the Earth

Resolved Issues:
  - GMSPolyline width is much closer to screen width
  - GMSPolyline performance and memory improvements
  - Reduced memory use of OpenGL textures
  - Floor picker is positioned correctly when My Location button is disabled
  - cameraForBounds:insets: on GMSMapView now correctly accounts for padding

Notes:
  - To align with other Google Maps APIs, GMSMapView no longer provides helper
    methods to retrieve previously added overlays, such as -markers, -polylines
    and -groundOverlays

Version 1.6.2 - January 2014
============================
Resolved Issues:
  - Resolved a gesture bug effecting full-screen maps on iOS 7
  - Resolved an issue where overlays were sometimes not initially tappable

Version 1.6.1 - December 2013
=============================
Resolved Issues:
  - Resolved a memory leak involving vector tiles
  - Markers not immediately added to a GMSMapView no longer fail to appear
    when configured at a later point
  - GMSMapView/GMSPanoramaView will now continue to render while your
    application is resigned

Version 1.6.0 - November 2013
=============================
Features:
  - The Google Maps SDK for iOS now supports 64-bit architectures
  - Added the ability to restrict min and max zoom on GMSMapView
  - Added opacity on GMSTileLayer
  - Added opacity on GMSMarker, which may be animated
  - Updated types within the SDK and used float or double instead of CGFloat
    in cases where it was more appropriate
  - Core Animation on GMSMapView now requires model values to be set

Resolved Issues:
  - Marker info windows and tappable regions now rotate correctly with markers
  - Padding on a GMSMapView is no longer clamped to its bounds (useful if
    setting padding on an initially zero-sized map)
  - Copyright information now animates alongside changing GMSMapView size or
    padding
  - Info windows are removed if their GMSMarker is removed from a GMSMapView
  - My Location dot uses the last known information when enabled
  - Resolved two rare race conditions that were causing crashes
  - Resolved an issue where retain cycles were causing memory leaks on
    GMSMapView and GMSPanoramaView

Version 1.5.0 - September 2013
==============================
Features:
  - This release officially supports iOS 7, and requires iOS 6.0 or later (iOS
    5.1 is no longer supported).
  - The 'animated' field on GMSMarker is now known as 'appearAnimation', and
    may be set to kGMSMarkerAnimationNone (default) or kGMSMarkerAnimationPop
  - The Google Maps SDK for iOS now ships with an armv7s slice
  - New features for GMSMarker instances
    * Markers can be made draggable using the draggable property, and new drag
      delegate methods have been added to GMSMapViewDelegate
    * Added GMSMarkerLayer, a custom CALayer subclass for GMSMarker that
      supports animation of marker position and rotation
    * Added support for markers that appear flat against the Earth's surface
    * Added rotation property to rotate markers around their ground anchor
    * The UIImage used by GMSMarker now supports the images and duration
      properties, and will animate images with multiple frames
    * The UIImage used by GMSMarker now supports alignmentRectInsets, and will
      adjust groundAnchor, infoWindowAnchor, and the tappable region
  - Added padding on GMSMapView, allowing you to indicate parts of the map that
    may be obscured by other views; setting padding re-positions the standard
    map controls, and the camera and camera updates will use the padded region
  - GMSPanoramaView and GMSPanoramaService now support searching for panoramas
    with custom radius
  - Added cameraForBounds:insets: to GMSMapView, allowing construction of a
    GMSCameraPosition for the map from a specified GMSCoordinateBounds

Resolved Issues:
  - My Location button now clips within GMSMapView
  - Reduced memory usage of GMSMapView through less agressive tile caching
  - Reduced the time taken to obtain GMSServices by moving some startup tasks
    to a background thread; obtaining this object early in your application
    (before creating a GMSMapView or other objects) may improve performance
  - Polylines may now be drawn twice, as required, if they have very large
    longitudinal span
  - Resolved a rounding error with very small polygons far from latlng (0,0)

Version 1.4.3 - August 2013
===========================
Resolved Issues:
  - Resolved several causes of modifying markers that could cause 'ghost'
    markers to appear
  - Resolved excess texture use when modifying animated markers

Version 1.4.2 - August 2013
===========================
Resolved Issues:
  - Fixed a rare case where modifying an animated marker could cause 'ghost'
    markers to appear
  - Prioritized markers over other overlays for tappability

Version 1.4.1 - August 2013
===========================
Features:
  - Tappable markers inside GMSPanoramaView using the
    panoramaView:didTapMarker: delegate method on GMSPanoramaViewDelegate
  - Added GMSPanoramaLayer, a custom CALayer subclass for GMSPanoramaView that
    supports animation of the panorama camera
  - GMSPanoramaCamera supports custom field of view (FOV)
  - Programmatic access to the floor picker allows you to enable or disable the
    selector, and set which floor should be displayed
  - GMSTileLayer now supports high DPI tiles, for use on a Retina device
  - GMSMapView.camera is now observable via KVO
  - Added fitBounds:withEdgeInsets: to GMSCameraUpdate
  - The default behavior of a GMSMapView to consume all gestures within its
    bounds may now be disabled via consumesGesturesInView
  - Expanded GMSGeometryUtils to include additional helper methods
  - GMSServices may be held by applications to maintain cache and connection to
    Google; this can improve performance when creating and destroying many maps
  - Improved visuals when resizing a GMSMapView via UIView animation methods

Resolved Issues:
  - Fixed crash bug during memory warning (related to indoor)
  - Fixed crash bug with indoor maps on iOS 5.1
  - Performance improvements when using hundreds of GMSMarkers
  - Reduced memory footprint of GMSMapView
  - Touch target for GMSMarkers matches the size and shape of the marker when
    the GMSMapView is tilted
  - GMSMapView will no longer render a single frame of black in some cases
    (noticable e.g., inside UISplitViewController on iPad)
  - Street View imagery is now adjusted correctly for tilted base data
    (e.g., data taken by a Street View car on a slope)
  - Geodesic interpolation has been tweaked to be more correct
  - Fixed incorrect GMSGroundOverlay sizing (regression in 1.4.0)
  - fitBounds:withPadding: on GMSCameraUpdate now correctly applies padding to
    all edges of the bounds; previously it used 1/2 padding on each edge

Version 1.4.0 - July 2013
=========================
Features:
  - Support for Google Street View imagery, with coverage in 50+ countries
    * Added GMSPanoramaView, a viewer for Street View imagery, that enables
      both programmatic and user control
    * GMSMarkers can be shared between GMSMapView and GMSPanoramaView
    * GMSPanoramaService may be used to load panorama data ahead of display
  - Indoor floor plans and a floor selector control will now be displayed when
    available
  - Updated map design inspired by the new Google Maps
  - Info windows now show at 1:1 resolution on the screen regardless of tilt
  - Additional delegate methods on GMSMapView - mapView:willMove: and
    mapView:idleAtCameraPosition: - allow you to detect the start and
    end of camera movement, respectively
  - An improved look and feel for polylines and polygon stroke
  - Added a zIndex property on all overlays; z-indexes are calculated in two
    groups: GMSMarkers and all other overlays
  - Added GMSGeometryUtils methods for heading, distance, offset etc. with
    respect to points on the Earth

Resolved Issues:
  - Improved the tappability of GMSPolygon
  - The compass now disappears when the map returns to zero bearing for any
    reason, including animation
  - Resolved crash issue when creating a zero-sized GMSPolygon
  - Resolved an issue where active gestures could cause a GMSMapView to not
    be released until deceleration completed
  - Info windows no longer allow taps to pass through them
  - Accessibility elements on GMSMapView are now hidden by default; you can
    enable via accessibilityElementsHidden

Notes:
  - To align with other Google Maps APIs, GMSGroundOverlay no longer supports
    the zoomLevel property. You can use the helper method
    groundOverlayWithPosition:icon:zoomLevel: to migrate existing code

Version 1.3.1 - June 2013
=========================
Resolved Issues:
  - Shows all tiles when animating across the antimeridian
  - Performance improvements while zooming
  - Touches are consumed more agressively by GMSMapView
  - Fixed constructing a GMSMutablePath via pathFromEncodedPath:
  - Restores OpenGL state correctly in GMSMapView in applications that also use
    GLKView

Version 1.3.0 - May 2013
========================
Features:
  - Support for custom tile overlays (image-based) via GMSTileLayer
  - Anti-aliasing for GMSPolyline and GMSPolygon stroke
  - Support for 'invisible' base map tiles via kGMSTypeNone
  - Basic support for CAAnimationGroup on GMSMapLayer

Resolved Issues:
  - Performance improvements with large numbers of overlays
  - Resolved excessive memory use when device was locked/unlocked while an info
    window was displayed
  - Animations are stopped when a user performs a gesture
  - Animations stop any active gesture (e.g., a pan)
  - Resolved crash issue with setting/clearing My Location dot.
  - GMSPolyline and GMSPolygon now support greater precision at high zoom
  - GMSPolyline and GMSPolygon use the correct alpha values
  - Touches are consumed by GMSMapView, allowing use within e.g. a scroll view

Version 1.2.2 - April 2013
==========================
Resolved Issues:
  - Tappable regions for GMSMarker fixed.
  - Overlays are no longer able to render on half pixels.
  - Ground overlays appear underneath the My Location dot.
  - GMSPolyline 'strokeColor' is no longer erroneously deallocated.

Version 1.2.0 - April 2013
==========================
Features:
  - Removed GMS...Options classes in favor of creating overlays directly
    and setting their 'map' property
  - Map overlays (GMSMarker, GMSPolyline, others) now inherit from a shared
    GMSOverlay class
  - GMSPolyline now has 'strokeWidth' and 'strokeColor' to match GMSPolygon,
    rather than 'width' and 'stroke'
  - More helper methods on GMSCoordinateBounds, 'including' renamed to
    'includingCoordinate', added 'includingBounds'
  - Added GMSPolygon and GMSCircle overlays
  - A GMSMarker may be animated when added to a map
  - Overlay types may now be subclassed
  - GMSCameraUpdate to create camera update objects, including operations to
    set a camera that presents a specified GMSCoordinateBounds
  - GMSUISettings may be used to add a compass or My Location button (disabled
    by default)
  - Non-marker overlay types may be tapped (see GMSMapViewDelegate)
  - Default marker changed to the Google Maps for iPhone marker
  - Added markerImageWithColor: to create tinted versions of the default marker
  - GMSMapLayer, the CALayer subclass for GMSMapView, now supports modification
    of its camera properties, allowing for advanced animation effects

Resolved Issues:
  - visibleRegion now reports correctly sized region on Retina devices
  - Double-tap to zoom now centers around tapped point
  - Disabling pan via UISettings now prevents movement with zoom gestures
  - GMSPolyline performance is improved for large polylines
  - GMSMapView may be subclassed
  - My Location dot appears underneath markers
  - Performance improvements when using the My Location dot
  - Grayscale polylines now render correctly
  - Calling renderInContext: on the GMSMapView layer now renders correctly;
    this allows for snapshots and UI effects
  - The default behavior when a marker is tapped has been updated to also pan
    the camera to the marker's position
  - semaphore_wait_trap issue resolved

Version 1.1.2 - March 2013
==========================
Resolved Issues:
  - Updated the SDK to use libc++ instead of libstdc++
  - Improved support for including a GMSMapView and GLKView in the same app

Version 1.1.1 - March 2013
==========================
Features:
  - Improved the messages that are logged to the console when a invalid key is
    used or a connection error occurs
  - Added multi-line snippet support for GMSMarker

Resolved Issues:
  - GMSMapView could return a nil camera
  - Multiple GMSMapView instances no longer 'camera crosstalk.'
  - The SDK contained unresolved external references
  - A GMSMarker with an empty title and snippet no longer shows an empty
    info window.

Version 1.1.0 - February 2013
=============================
Features:
  - The points of a GMSPolyline (and GMSPolylineOptions) are now specified as
    a GMSPath and built via a GMSMutablePath, rather than addVertex: etc
  - GMSPolyline may now be specified as geodesic
  - animateToCameraPosition: method on GMSMapView
  - GMSProjection provides containsCoordinate: and visibleRegion helpers

Resolved Issues:
  - GMSCameraPosition and animateToLocation: now clamp/wrap latitude/longitude
    respectively; similarly, bearing is clamped to 0 <= bearing < 360
  - GMSGroundOverlay may be modified after creation
  - The points of a GMSPoyline may be modified after creation
  - GMSPolyline may cross the antimeridian
  - Resolved a marker sorting issue

Version 1.0.2 - January 2013
============================
Features:
  - GMSCamera (struct) has been dropped in favor of GMSCameraPosition * (objc
    class), supports finer control of bearing and viewing angle
  - Added GMSUISettings to control gesture availability
  - Added GMSGroundOverlay/GMSGroundOverlayOptions for basic ground overlay
    support
  - Removed requirement to call startRendering/stopRendering
  - Support for adding GMSMapView as a custom UIView in Interface Builder
  - Improved texture memory handling

Resolved Issues:
  - Info windows now have highest tap priority
  - Selected markers are automatically brought to front
  - Polylines now render at constant size regardless of the zoom level

Version 1.0.1 - December 2012
=============================
Initial release alongside Google Maps for iOS.
Support for 3D maps, rotation, tilt, 3D buildings, markers, polylines,
satellite and terrain tiles, traffic data, and other features.
