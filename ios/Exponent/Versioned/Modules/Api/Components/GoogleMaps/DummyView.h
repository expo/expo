//
//  DummyView.h
//  AirMapsExplorer
//
//  Created by Gil Birman on 10/4/16.
//

#import <UIKit/UIKit.h>


@interface DummyView : UIView
@property (nonatomic, weak) UIView *view;
- (instancetype)initWithView:(UIView*)view;
@end
