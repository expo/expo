//
//  ABI49_0_0AIRGoogleMapOverlay.m
//  Created by Nick Italiano on 3/5/17.
//

#ifdef ABI49_0_0HAVE_GOOGLE_MAPS

#import "ABI49_0_0AIRGoogleMapOverlay.h"

#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcher.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageLoaderProtocol.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>

@interface ABI49_0_0AIRGoogleMapOverlay()
  @property (nonatomic, strong, readwrite) UIImage *overlayImage;
  @property (nonatomic, readwrite) GMSCoordinateBounds *overlayBounds;
  @property (nonatomic) CLLocationDirection bearing;
@end

@implementation ABI49_0_0AIRGoogleMapOverlay {
  ABI49_0_0RCTImageLoaderCancellationBlock _reloadImageCancellationBlock;
  CLLocationCoordinate2D _southWest;
  CLLocationCoordinate2D _northEast;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _overlay = [[GMSGroundOverlay alloc] init];
  }
  return self;
}

- (void)setImageSrc:(NSString *)imageSrc
{
  NSLog(@">>> SET IMAGESRC: %@", imageSrc);
  _imageSrc = imageSrc;

  if (_reloadImageCancellationBlock) {
    _reloadImageCancellationBlock();
    _reloadImageCancellationBlock = nil;
  }

  __weak typeof(self) weakSelf = self;
  _reloadImageCancellationBlock = [[_bridge moduleForName:@"ImageLoader"] loadImageWithURLRequest:[ABI49_0_0RCTConvert NSURLRequest:_imageSrc]
                                                                          size:weakSelf.bounds.size
                                                                         scale:ABI49_0_0RCTScreenScale()
                                                                       clipped:YES
                                                                    resizeMode:ABI49_0_0RCTResizeModeCenter
                                                                 progressBlock:nil
                                                              partialLoadBlock:nil
                                                               completionBlock:^(NSError *error, UIImage *image) {
                                                                 if (error) {
                                                                   NSLog(@"%@", error);
                                                                 }
                                                                 dispatch_async(dispatch_get_main_queue(), ^{
                                                                   NSLog(@">>> IMAGE: %@", image);
                                                                   weakSelf.overlayImage = image;
                                                                   weakSelf.overlay.icon = image;
                                                                 });
                                                               }];

}

- (void)setBoundsRect:(NSArray *)boundsRect
{
  _boundsRect = boundsRect;

  _southWest = CLLocationCoordinate2DMake([boundsRect[1][0] doubleValue], [boundsRect[0][1] doubleValue]);
  _northEast = CLLocationCoordinate2DMake([boundsRect[0][0] doubleValue], [boundsRect[1][1] doubleValue]);

  _overlayBounds = [[GMSCoordinateBounds alloc] initWithCoordinate:_southWest
                                                        coordinate:_northEast];

  _overlay.bounds = _overlayBounds;
}

- (void)setBearing:(double)bearing
{
    _bearing = (double)bearing;
    _overlay.bearing = _bearing;
}

- (void)setOpacity:(CGFloat)opacity
{
  _overlay.opacity = opacity;
}

@end

#endif
