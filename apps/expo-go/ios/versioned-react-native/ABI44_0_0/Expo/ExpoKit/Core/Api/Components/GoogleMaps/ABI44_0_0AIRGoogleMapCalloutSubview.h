//
//  ABI44_0_0AIRGoogleMapCalloutSubview.h
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI44_0_0HAVE_GOOGLE_MAPS

#import <UIKit/UIKit.h>
#import <ABI44_0_0React/ABI44_0_0RCTView.h>

@interface ABI44_0_0AIRGoogleMapCalloutSubview : UIView
@property (nonatomic, copy) ABI44_0_0RCTBubblingEventBlock onPress;
@end

#endif
