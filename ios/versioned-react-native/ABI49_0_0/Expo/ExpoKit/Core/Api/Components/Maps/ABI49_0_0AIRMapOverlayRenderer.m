#import "ABI49_0_0AIRMapOverlayRenderer.h"
#import "ABI49_0_0AIRMapOverlay.h"

@implementation ABI49_0_0AIRMapOverlayRenderer

- (void)drawMapRect:(MKMapRect)mapRect zoomScale:(MKZoomScale)zoomScale inContext:(CGContextRef)context {
    UIImage *image = [(ABI49_0_0AIRMapOverlay *)self.overlay overlayImage];
    
    CGContextSaveGState(context);
    
    CGImageRef imageReference = image.CGImage;
    
    MKMapRect theMapRect = [self.overlay boundingMapRect];
    CGRect theRect = [self rectForMapRect:theMapRect];
    
    CGContextRotateCTM(context, M_PI);
    CGContextScaleCTM(context, -1.0, 1.0);
    CGContextTranslateCTM(context, 0.0, -theRect.size.height);
    CGContextAddRect(context, theRect);
    CGContextDrawImage(context, theRect, imageReference);
    
    CGContextRestoreGState(context);
}

- (BOOL)canDrawMapRect:(MKMapRect)mapRect zoomScale:(MKZoomScale)zoomScale {
    return [(ABI49_0_0AIRMapOverlay *)self.overlay overlayImage] != nil;
}

@end

