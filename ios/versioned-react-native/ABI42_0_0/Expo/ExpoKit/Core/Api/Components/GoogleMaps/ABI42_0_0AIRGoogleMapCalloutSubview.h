//
//  ABI42_0_0AIRGoogleMapCalloutSubview.h
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI42_0_0HAVE_GOOGLE_MAPS

#import <UIKit/UIKit.h>
#import <ABI42_0_0React/ABI42_0_0RCTView.h>

@interface ABI42_0_0AIRGoogleMapCalloutSubview : UIView
@property (nonatomic, copy) ABI42_0_0RCTBubblingEventBlock onPress;
@end

#endif
