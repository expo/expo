//
//  BranchViewHandler.m
//  Branch-TestBed
//
//  Created by Sojan P.R. on 3/3/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//

#import "BranchViewHandler.h"
#import "Branch.h"
#import "BranchView.h"

@interface BranchViewHandler() <UIWebViewDelegate>

@property (nonatomic, strong) BranchView *pendingBranchView;
@property (nonatomic, strong) UIWebView *pendingWebview;

@end

static NSString * const BRANCH_VIEW_REDIRECT_SCHEME = @"branch-cta";
static NSString * const BRANCH_VIEW_REDIRECT_ACTION_ACCEPT = @"accept";
static NSString * const BRANCH_VIEW_REDIRECT_ACTION_CANCEL = @"cancel";
static NSInteger  const BRANCH_VIEW_ERR_TEMP_UNAVAILABLE = -202;

@implementation BranchViewHandler

static BranchViewHandler *branchViewHandler;
static BOOL isBranchViewAccepted = NO;
static NSString *currentActionName;
static NSString *currentBranchViewID;

+ (BranchViewHandler *)getInstance {
    if (!branchViewHandler) {
        branchViewHandler = [[BranchViewHandler alloc] init];
    }
    return branchViewHandler;
}

- (BOOL)showBranchView:(NSString *)actionName withBranchViewDictionary:(NSDictionary*)branchViewDict andWithDelegate:(id)callback {
    BranchView *branchView = [[BranchView alloc] initWithBranchView:branchViewDict andActionName:actionName];
    return [self showBranchView:branchView withDelegate:callback];
}

- (BOOL)showBranchView:(BranchView *)branchView withDelegate:(id)callback {
    if ([branchView isAvailable]) {
        self.branchViewCallback = callback;
        [self showView:branchView];
        return YES;
    } else {
        return NO;
    }
}

- (void)showView:(BranchView *)branchView {
    CGRect screenRect = [[UIScreen mainScreen] bounds];
    UIWebView *webview = [[UIWebView alloc] initWithFrame:CGRectMake(0, 0, screenRect.size.width, screenRect.size.height)];
    
    webview.scrollView.scrollEnabled = NO;
    webview.scrollView.bounces = NO;
    webview.delegate = self;
    
    if (branchView.webHtml && ![branchView.webHtml isKindOfClass:[NSNull class]]) {
        [webview loadHTMLString:branchView.webHtml baseURL:nil];
    }
    else if (branchView.webUrl && ![branchView.webUrl isKindOfClass:[NSNull class]]) {
        NSURL *url = [NSURL URLWithString:branchView.webUrl];
        NSURLRequest *requestObj = [NSURLRequest requestWithURL:url];
        [webview loadRequest:requestObj];
    }
    else {
        return;
    }
    
    isBranchViewAccepted = NO;
    currentActionName = branchView.branchViewAction;
    currentBranchViewID = branchView.branchViewID;
    
    if (self.pendingBranchView == nil) {
        self.pendingBranchView = branchView;
    }
    if (self.pendingWebview == nil) {
        self.pendingWebview = webview;
    }
    // Now delay showing the webview until a successful load completes.
}

- (void)closeBranchView {
    UIViewController *presentingViewController = [UIViewController bnc_currentViewController];
    [presentingViewController dismissViewControllerAnimated:YES completion:nil];
    
    if (self.branchViewCallback) {
        if (isBranchViewAccepted) {
            [self.branchViewCallback branchViewAccepted:currentActionName withID:currentBranchViewID];
        }
        else {
            [self.branchViewCallback branchViewCancelled:currentActionName withID:currentBranchViewID];
        }
    }
}

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType {
    BOOL isRedirectHandled = [self handleUserActionRedirects:request];
    if (isRedirectHandled) {
        [self closeBranchView];
    }
    return !isRedirectHandled;
}

- (void)webViewDidFinishLoad:(UIWebView *)webView {
    NSCachedURLResponse *resp = [[NSURLCache sharedURLCache] cachedResponseForRequest:webView.request];
    NSInteger statusCode = [(NSHTTPURLResponse*)resp.response statusCode];
    if (statusCode == 200) {
        if (self.pendingBranchView != nil && self.pendingWebview != nil) {
            UIViewController *holderView = [[UIViewController alloc] init];
            [holderView.view insertSubview:self.pendingWebview atIndex:0];

            UIViewController *presentingViewController = [UIViewController bnc_currentViewController];
            [presentingViewController presentViewController:holderView animated:YES completion:nil];
            
            [self.pendingBranchView updateUsageCount];
            
            if (self.branchViewCallback) {
                [self.branchViewCallback branchViewVisible:self.pendingBranchView.branchViewAction withID:self.pendingBranchView.branchViewID];
            }
        }
    } else {
        if (self.branchViewCallback) {
            NSString *message = [NSString stringWithFormat:@"%ld: %@", (long)statusCode, [NSHTTPURLResponse localizedStringForStatusCode:statusCode]];
            [self.branchViewCallback branchViewErrorCode:BRANCH_VIEW_ERR_TEMP_UNAVAILABLE message:message actionName:self.pendingBranchView.branchViewAction withID:self.pendingBranchView.branchViewID];
        }
    }
    self.pendingBranchView = nil;
    self.pendingWebview = nil;
}

- (BOOL)handleUserActionRedirects:(NSURLRequest *)request {
    BOOL isRedirectionHandled = NO;
    if ([[request.URL scheme] isEqualToString:BRANCH_VIEW_REDIRECT_SCHEME]) {
        if ([[request.URL host] isEqualToString:BRANCH_VIEW_REDIRECT_ACTION_ACCEPT]) {
            isBranchViewAccepted = YES;
        }
        else if ([[request.URL host] isEqualToString:BRANCH_VIEW_REDIRECT_ACTION_CANCEL]) {
            isBranchViewAccepted = NO;
        }
        isRedirectionHandled = YES;
    }
    return isRedirectionHandled;
}


@end
