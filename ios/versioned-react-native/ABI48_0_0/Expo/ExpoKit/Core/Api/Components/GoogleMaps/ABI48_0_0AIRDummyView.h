//
//  ABI48_0_0AIRDummyView.h
//  AirMapsExplorer
//
//  Created by Gil Birman on 10/4/16.
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS

#import <UIKit/UIKit.h>


@interface ABI48_0_0AIRDummyView : UIView
@property (nonatomic, weak) UIView *view;
- (instancetype)initWithView:(UIView*)view;
@end

#endif
