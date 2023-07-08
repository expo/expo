#import "ABI49_0_0AIRMapOverlay.h"

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcher.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageLoaderProtocol.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>

@interface ABI49_0_0AIRMapOverlay()
@property (nonatomic, strong, readwrite) UIImage *overlayImage;
@end

@implementation ABI49_0_0AIRMapOverlay {
    ABI49_0_0RCTImageLoaderCancellationBlock _reloadImageCancellationBlock;
    CLLocationCoordinate2D _southWest;
    CLLocationCoordinate2D _northEast;
    MKMapRect _mapRect;
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
                                                                         [weakSelf createOverlayRendererIfPossible];
                                                                         [weakSelf update];
                                                                     });
                                                                 }];
}

- (void)setBoundsRect:(NSArray *)boundsRect {
    _boundsRect = boundsRect;

    _southWest = CLLocationCoordinate2DMake([boundsRect[0][0] doubleValue], [boundsRect[0][1] doubleValue]);
    _northEast = CLLocationCoordinate2DMake([boundsRect[1][0] doubleValue], [boundsRect[1][1] doubleValue]);

    MKMapPoint southWest = MKMapPointForCoordinate(_southWest);
    MKMapPoint northEast = MKMapPointForCoordinate(_northEast);

    _mapRect = MKMapRectMake(southWest.x, northEast.y, ABS(northEast.x - southWest.x), ABS(northEast.y - southWest.y));

    [self update];
}

- (void)createOverlayRendererIfPossible
{
    if (MKMapRectIsEmpty(_mapRect) || !self.overlayImage) return;
    __weak typeof(self) weakSelf = self;
    self.renderer = [[ABI49_0_0AIRMapOverlayRenderer alloc] initWithOverlay:weakSelf];
}

- (void)update
{
    if (!_renderer) return;

    if (_map == nil) return;
    [_map removeOverlay:self];
    [_map addOverlay:self];
}


#pragma mark MKOverlay implementation

- (CLLocationCoordinate2D)coordinate
{
    return MKCoordinateForMapPoint(MKMapPointMake(MKMapRectGetMidX(_mapRect), MKMapRectGetMidY(_mapRect)));
}

- (MKMapRect)boundingMapRect
{
    return _mapRect;
}

- (BOOL)intersectsMapRect:(MKMapRect)mapRect
{
    return MKMapRectIntersectsRect(_mapRect, mapRect);
}

- (BOOL)canReplaceMapContent
{
    return NO;
}

@end
