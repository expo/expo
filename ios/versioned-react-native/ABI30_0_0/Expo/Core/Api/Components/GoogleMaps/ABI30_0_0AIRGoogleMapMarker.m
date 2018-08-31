//
//  ABI30_0_0AIRGoogleMapMarker.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI30_0_0AIRGoogleMapMarker.h"
#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI30_0_0/ABI30_0_0RCTImageLoader.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUtils.h>
#import "ABI30_0_0AIRGMSMarker.h"
#import "ABI30_0_0AIRGoogleMapCallout.h"
#import "ABI30_0_0AIRDummyView.h"

CGRect unionRect(CGRect a, CGRect b) {
  return CGRectMake(
                    MIN(a.origin.x, b.origin.x),
                    MIN(a.origin.y, b.origin.y),
                    MAX(a.size.width, b.size.width),
                    MAX(a.size.height, b.size.height));
}

@interface ABI30_0_0AIRGoogleMapMarker ()
- (id)eventFromMarker:(ABI30_0_0AIRGMSMarker*)marker;
@end

@implementation ABI30_0_0AIRGoogleMapMarker {
  ABI30_0_0RCTImageLoaderCancellationBlock _reloadImageCancellationBlock;
  __weak UIImageView *_iconImageView;
  UIView *_iconView;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _realMarker = [[ABI30_0_0AIRGMSMarker alloc] init];
    _realMarker.fakeMarker = self;
    _realMarker.tracksViewChanges = true;
    _realMarker.tracksInfoWindowChanges = false;
  }
  return self;
}

- (void)layoutSubviews {
  float width = 0;
  float height = 0;

  for (UIView *v in [_iconView subviews]) {

    float fw = v.frame.origin.x + v.frame.size.width;
    float fh = v.frame.origin.y + v.frame.size.height;

    width = MAX(fw, width);
    height = MAX(fh, height);
  }

  [_iconView setFrame:CGRectMake(0, 0, width, height)];
}

- (id)eventFromMarker:(ABI30_0_0AIRGMSMarker*)marker {

  CLLocationCoordinate2D coordinate = marker.position;
  CGPoint position = [self.realMarker.map.projection pointForCoordinate:coordinate];

  return @{
         @"id": marker.identifier ?: @"unknown",
         @"position": @{
             @"x": @(position.x),
             @"y": @(position.y),
             },
         @"coordinate": @{
             @"latitude": @(coordinate.latitude),
             @"longitude": @(coordinate.longitude),
             }
         };
}

- (void)iconViewInsertSubview:(UIView*)subview atIndex:(NSInteger)atIndex {
  if (!_realMarker.iconView) {
    _iconView = [[UIView alloc] init];
    _realMarker.iconView = _iconView;
  }
  [_iconView insertSubview:subview atIndex:atIndex];
}

- (void)insertReactABI30_0_0Subview:(id<ABI30_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex {
  if ([subview isKindOfClass:[ABI30_0_0AIRGoogleMapCallout class]]) {
    self.calloutView = (ABI30_0_0AIRGoogleMapCallout *)subview;
  } else { // a child view of the marker
    [self iconViewInsertSubview:(UIView*)subview atIndex:atIndex+1];
  }
  ABI30_0_0AIRDummyView *dummySubview = [[ABI30_0_0AIRDummyView alloc] initWithView:(UIView *)subview];
  [super insertReactABI30_0_0Subview:(UIView*)dummySubview atIndex:atIndex];
}

- (void)removeReactABI30_0_0Subview:(id<ABI30_0_0RCTComponent>)dummySubview {
  UIView* subview = ((ABI30_0_0AIRDummyView*)dummySubview).view;

  if ([subview isKindOfClass:[ABI30_0_0AIRGoogleMapCallout class]]) {
    self.calloutView = nil;
  } else {
    [(UIView*)subview removeFromSuperview];
  }
  [super removeReactABI30_0_0Subview:(UIView*)dummySubview];
}

- (void)showCalloutView {
  [_realMarker.map setSelectedMarker:_realMarker];
}

- (void)hideCalloutView {
  [_realMarker.map setSelectedMarker:Nil];
}

- (UIView *)markerInfoContents {
  if (self.calloutView && !self.calloutView.tooltip) {
    return self.calloutView;
  }
  return nil;
}

- (UIView *)markerInfoWindow {
  if (self.calloutView && self.calloutView.tooltip) {
    return self.calloutView;
  }
  return nil;
}

- (void)didTapInfoWindowOfMarker:(ABI30_0_0AIRGMSMarker *)marker {
  if (self.calloutView && self.calloutView.onPress) {
    id event = @{@"action": @"marker-overlay-press",
                 @"id": self.identifier ?: @"unknown",
                 };
    self.calloutView.onPress(event);
  }
}

- (void)didBeginDraggingMarker:(ABI30_0_0AIRGMSMarker *)marker {
  if (!self.onDragStart) return;
  self.onDragStart([self eventFromMarker:marker]);
}

- (void)didEndDraggingMarker:(ABI30_0_0AIRGMSMarker *)marker {
  if (!self.onDragEnd) return;
  self.onDragEnd([self eventFromMarker:marker]);
}

- (void)didDragMarker:(ABI30_0_0AIRGMSMarker *)marker {
  if (!self.onDrag) return;
  self.onDrag([self eventFromMarker:marker]);
}

- (void)setCoordinate:(CLLocationCoordinate2D)coordinate {
  _realMarker.position = coordinate;
}

- (CLLocationCoordinate2D)coordinate {
  return _realMarker.position;
}

- (void)setRotation:(CLLocationDegrees)rotation {
    _realMarker.rotation = rotation;
}

- (CLLocationDegrees)rotation {
    return _realMarker.rotation;
}

- (void)setIdentifier:(NSString *)identifier {
  _realMarker.identifier = identifier;
}

- (NSString *)identifier {
  return _realMarker.identifier;
}

- (void)setOnPress:(ABI30_0_0RCTBubblingEventBlock)onPress {
  _realMarker.onPress = onPress;
}

- (ABI30_0_0RCTBubblingEventBlock)onPress {
  return _realMarker.onPress;
}

- (void)setOpacity:(double)opacity
{
  _realMarker.opacity = opacity;
}

- (void)setImageSrc:(NSString *)imageSrc
{
  _imageSrc = imageSrc;

  if (_reloadImageCancellationBlock) {
    _reloadImageCancellationBlock();
    _reloadImageCancellationBlock = nil;
  }

  if (!_imageSrc) {
    if (_iconImageView) [_iconImageView removeFromSuperview];
    return;
  }

  if (!_iconImageView) {
    // prevent glitch with marker (cf. https://github.com/airbnb/ReactABI30_0_0-native-maps/issues/738)
    UIImageView *empyImageView = [[UIImageView alloc] init];
    _iconImageView = empyImageView;
    [self iconViewInsertSubview:_iconImageView atIndex:0];
  }

  _reloadImageCancellationBlock = [_bridge.imageLoader loadImageWithURLRequest:[ABI30_0_0RCTConvert NSURLRequest:_imageSrc]
                                                                          size:self.bounds.size
                                                                         scale:ABI30_0_0RCTScreenScale()
                                                                       clipped:YES
                                                                    resizeMode:ABI30_0_0RCTResizeModeCenter
                                                                 progressBlock:nil
                                                              partialLoadBlock:nil
                                                               completionBlock:^(NSError *error, UIImage *image) {
                                                                 if (error) {
                                                                   // TODO(lmr): do something with the error?
                                                                   NSLog(@"%@", error);
                                                                 }
                                                                 dispatch_async(dispatch_get_main_queue(), ^{

                                                                   // TODO(gil): This way allows different image sizes
                                                                   if (_iconImageView) [_iconImageView removeFromSuperview];

                                                                   // ... but this way is more efficient?
//                                                                   if (_iconImageView) {
//                                                                     [_iconImageView setImage:image];
//                                                                     return;
//                                                                   }

                                                                   UIImageView *imageView = [[UIImageView alloc] initWithImage:image];

                                                                   // TODO: w,h or pixel density could be a prop.
                                                                   float density = 1;
                                                                   float w = image.size.width/density;
                                                                   float h = image.size.height/density;
                                                                   CGRect bounds = CGRectMake(0, 0, w, h);

                                                                   imageView.contentMode = UIViewContentModeScaleAspectFit;
                                                                   [imageView setFrame:bounds];

                                                                   // NOTE: sizeToFit doesn't work instead. Not sure why.
                                                                   // TODO: Doing it this way is not ideal because it causes things to reshuffle
                                                                   //       when the image loads IF the image is larger than the UIView.
                                                                   //       Shouldn't required images have size info automatically via ABI30_0_0RN?
                                                                   CGRect selfBounds = unionRect(bounds, self.bounds);
                                                                   [self setFrame:selfBounds];

                                                                   _iconImageView = imageView;
                                                                   [self iconViewInsertSubview:imageView atIndex:0];
                                                                 });
                                                               }];
}

- (void)setTitle:(NSString *)title {
  _realMarker.title = [title copy];
}

- (NSString *)title {
  return _realMarker.title;
}

- (void)setSubtitle:(NSString *)subtitle {
  _realMarker.snippet = subtitle;
}

- (NSString *)subtitle {
  return _realMarker.snippet;
}

- (void)setPinColor:(UIColor *)pinColor {
  _pinColor = pinColor;
  _realMarker.icon = [GMSMarker markerImageWithColor:pinColor];
}

- (void)setAnchor:(CGPoint)anchor {
  _anchor = anchor;
  _realMarker.groundAnchor = anchor;
}


- (void)setZIndex:(NSInteger)zIndex
{
  _zIndex = zIndex;
  _realMarker.zIndex = (int)zIndex;
}

- (void)setDraggable:(BOOL)draggable {
  _realMarker.draggable = draggable;
}

- (BOOL)draggable {
  return _realMarker.draggable;
}

- (void)setTracksViewChanges:(BOOL)tracksViewChanges {
  _realMarker.tracksViewChanges = tracksViewChanges;
}

- (BOOL)tracksViewChanges {
  return _realMarker.tracksViewChanges;
}

- (void)setTracksInfoWindowChanges:(BOOL)tracksInfoWindowChanges {
  _realMarker.tracksInfoWindowChanges = tracksInfoWindowChanges;
}

- (BOOL)tracksInfoWindowChanges {
  return _realMarker.tracksInfoWindowChanges;
}

@end
