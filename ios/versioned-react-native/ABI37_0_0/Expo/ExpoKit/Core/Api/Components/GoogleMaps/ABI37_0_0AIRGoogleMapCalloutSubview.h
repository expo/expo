//
//  ABI37_0_0AIRGoogleMapCalloutSubview.h
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI37_0_0HAVE_GOOGLE_MAPS

#import <UIKit/UIKit.h>
#import <ABI37_0_0React/ABI37_0_0RCTView.h>

@interface ABI37_0_0AIRGoogleMapCalloutSubview : UIView
@property (nonatomic, copy) ABI37_0_0RCTBubblingEventBlock onPress;
@end

#endif
