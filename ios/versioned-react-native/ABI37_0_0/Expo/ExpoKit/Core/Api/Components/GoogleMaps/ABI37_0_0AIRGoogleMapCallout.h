//
//  ABI37_0_0AIRGoogleMapCallout.h
//  AirMaps
//
//  Created by Gil Birman on 9/6/16.
//
//

#ifdef ABI37_0_0HAVE_GOOGLE_MAPS

#import <UIKit/UIKit.h>
#import <ABI37_0_0React/ABI37_0_0RCTView.h>

@interface ABI37_0_0AIRGoogleMapCallout : UIView
@property (nonatomic, assign) BOOL tooltip;
@property (nonatomic, copy) ABI37_0_0RCTBubblingEventBlock onPress;
@property (nonatomic, assign) BOOL alphaHitTest;

- (BOOL) isPointInside:(CGPoint)pointInCallout;

@end

#endif
