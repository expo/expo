//
//  PeekAndPop.h
//  RouterE2E
//
//  Created by Jakub Tkacz on 26/05/2025.
//

#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface PeekAndPop : RCTViewComponentView
@end

@interface PeekAndPopTrigger : RCTViewComponentView
@end

@interface PeekAndPopPreview : RCTViewComponentView
- (void)updateShadowStateWithBounds:(CGRect)bounds;
@end

@interface PreviewViewController : UIViewController
- (instancetype)initWithPeekAndPopPreview:(PeekAndPopPreview *)peekAndPopPreview;
@end

NS_ASSUME_NONNULL_END
