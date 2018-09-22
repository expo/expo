/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import "BFAppLinkReturnToRefererController.h"

#import "BFAppLink.h"
#import "BFAppLinkReturnToRefererView_Internal.h"
#import "BFURL_Internal.h"

static const CFTimeInterval kBFViewAnimationDuration = 0.25f;

@implementation BFAppLinkReturnToRefererController {
    UINavigationController *_navigationController;
    BFAppLinkReturnToRefererView *_view;
}

#pragma mark - Object lifecycle

- (instancetype)init {
    return [self initForDisplayAboveNavController:nil];
}

- (instancetype)initForDisplayAboveNavController:(UINavigationController *)navController {
    self = [super init];
    if (self) {
        _navigationController = navController;

        if (_navigationController != nil) {
            NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
            [nc addObserver:self
                   selector:@selector(statusBarFrameWillChange:)
                       name:UIApplicationWillChangeStatusBarFrameNotification
                     object:nil];
            [nc addObserver:self
                   selector:@selector(statusBarFrameDidChange:)
                       name:UIApplicationDidChangeStatusBarFrameNotification
                     object:nil];
            [nc addObserver:self
                   selector:@selector(orientationDidChange:)
                       name:UIDeviceOrientationDidChangeNotification
                     object:nil];
        }
    }
    return self;
}

- (void)dealloc {
    _view.delegate = nil;
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Public API

- (BFAppLinkReturnToRefererView *)view {
    if (!_view) {
        self.view = [[BFAppLinkReturnToRefererView alloc] initWithFrame:CGRectZero];
        if (_navigationController) {
            [_navigationController.view addSubview:_view];
        }
    }
    return _view;
}

- (void)setView:(BFAppLinkReturnToRefererView *)view {
    if (_view != view) {
        _view.delegate = nil;
    }

    _view = view;
    _view.delegate = self;

    if (_navigationController) {
        _view.includeStatusBarInSize = BFIncludeStatusBarInSizeAlways;
    }
}

- (void)showViewForRefererAppLink:(BFAppLink *)refererAppLink {
    self.view.refererAppLink = refererAppLink;

    [_view sizeToFit];

    if (_navigationController) {
        if (!_view.closed) {
            dispatch_async(dispatch_get_main_queue(), ^{
                [self moveNavigationBar];
            });
        }
    }
}

- (void)showViewForRefererURL:(NSURL *)url {
    BFAppLink *appLink = [BFURL URLForRenderBackToReferrerBarURL:url].appLinkReferer;
    [self showViewForRefererAppLink:appLink];
}

- (void)removeFromNavController {
    if (_navigationController) {
        [_view removeFromSuperview];
        _navigationController = nil;
    }
}

#pragma mark - BFAppLinkReturnToRefererViewDelegate

- (void)returnToRefererViewDidTapInsideCloseButton:(BFAppLinkReturnToRefererView *)view {
    [self closeViewAnimated:YES explicitlyClosed:YES];
}

- (void)returnToRefererViewDidTapInsideLink:(BFAppLinkReturnToRefererView *)view
                                       link:(BFAppLink *)link {
    [self openRefererAppLink:link];
    [self closeViewAnimated:NO explicitlyClosed:NO];
}

#pragma mark - Private

- (void)statusBarFrameWillChange:(NSNotification *)notification {
    NSValue *rectValue = [[notification userInfo] valueForKey:UIApplicationStatusBarFrameUserInfoKey];
    CGRect newFrame;
    [rectValue getValue:&newFrame];

    if (_navigationController && !_view.closed) {
        if (CGRectGetHeight(newFrame) == 40) {
            UIViewAnimationOptions options = UIViewAnimationOptionBeginFromCurrentState;
            [UIView animateWithDuration:kBFViewAnimationDuration delay:0.0 options:options animations:^{
                _view.frame = CGRectMake(0.0, 0.0, CGRectGetWidth(_view.bounds), 0.0);
            } completion:nil];
        }
    }
}

- (void)statusBarFrameDidChange:(NSNotification *)notification {
    NSValue *rectValue = [[notification userInfo] valueForKey:UIApplicationStatusBarFrameUserInfoKey];
    CGRect newFrame;
    [rectValue getValue:&newFrame];

    if (_navigationController && !_view.closed) {
        if (CGRectGetHeight(newFrame) == 40) {
            UIViewAnimationOptions options = UIViewAnimationOptionBeginFromCurrentState;
            [UIView animateWithDuration:kBFViewAnimationDuration delay:0.0 options:options animations:^{
                [_view sizeToFit];
                [self moveNavigationBar];
            } completion:nil];
        }
    }
}

- (void)orientationDidChange:(NSNotificationCenter *)notification {
    if (_navigationController && !_view.closed && CGRectGetHeight(_view.bounds) > 0) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [self moveNavigationBar];
        });
    }
}

- (void)moveNavigationBar {
    if (_view.closed || !_view.refererAppLink) {
        return;
    }

    [self updateNavigationBarY:CGRectGetHeight(_view.bounds)];
}

- (void)updateNavigationBarY:(CGFloat)y {
    UINavigationBar *navigationBar = _navigationController.navigationBar;
    CGRect navigationBarFrame = navigationBar.frame;
    CGFloat oldContainerViewY = CGRectGetMaxY(navigationBarFrame);
    navigationBarFrame.origin.y = y;
    navigationBar.frame = navigationBarFrame;

    CGFloat dy = CGRectGetMaxY(navigationBarFrame) - oldContainerViewY;
    UIView *containerView = _navigationController.visibleViewController.view.superview;
    containerView.frame = UIEdgeInsetsInsetRect(containerView.frame, UIEdgeInsetsMake(dy, 0.0, 0.0, 0.0));
}

- (void)closeViewAnimated:(BOOL)animated {
    [self closeViewAnimated:animated explicitlyClosed:YES];
}

- (void)closeViewAnimated:(BOOL)animated explicitlyClosed:(BOOL)explicitlyClosed {
    void (^closer)(void) = ^{
        if (_navigationController) {
            [self updateNavigationBarY:_view.statusBarHeight];
        }

        CGRect frame = _view.frame;
        frame.size.height = 0.0;
        _view.frame = frame;
    };

    if (animated) {
        [UIView animateWithDuration:kBFViewAnimationDuration animations:^{
            closer();
        } completion:^(BOOL finished) {
            if (explicitlyClosed) {
                _view.closed = YES;
            }
        }];
    } else {
        closer();
        if (explicitlyClosed) {
            _view.closed = YES;
        }
    }
}

- (void)openRefererAppLink:(BFAppLink *)refererAppLink {
    if (refererAppLink) {
        id<BFAppLinkReturnToRefererControllerDelegate> delegate = _delegate;
        if ([delegate respondsToSelector:@selector(returnToRefererController:willNavigateToAppLink:)]) {
            [delegate returnToRefererController:self willNavigateToAppLink:refererAppLink];
        }

        NSError *error = nil;
        BFAppLinkNavigationType type = [BFAppLinkNavigation navigateToAppLink:refererAppLink error:&error];

        if ([delegate respondsToSelector:@selector(returnToRefererController:didNavigateToAppLink:type:)]) {
            [delegate returnToRefererController:self didNavigateToAppLink:refererAppLink type:type];
        }
    }
}

@end
