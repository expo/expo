//
//  AIRDummyView.h
//  AirMapsExplorer
//
//  Created by Gil Birman on 10/4/16.
//

#ifdef HAVE_GOOGLE_MAPS

#import <UIKit/UIKit.h>


@interface AIRDummyView : UIView
@property (nonatomic, weak) UIView *view;
- (instancetype)initWithView:(UIView*)view;
@end

#endif
