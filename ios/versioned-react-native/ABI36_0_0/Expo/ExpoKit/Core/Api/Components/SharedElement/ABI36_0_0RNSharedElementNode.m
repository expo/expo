//
//  ABI36_0_0RNSharedElementNode.m
//  ABI36_0_0React-native-shared-element
//

#import <UIKit/UIKit.h>
#import "ABI36_0_0RNSharedElementNode.h"

@implementation ABI36_0_0RNSharedElementNode
{
    long _refCount;
    long _hideRefCount;
    
    NSMutableArray* _contentRequests;
    NSObject* _contentCache;
    ABI36_0_0RNSharedElementContentType _contentTypeCache;
    
    NSMutableArray* _styleRequests;
    ABI36_0_0RNSharedElementStyle* _styleCache;
    
    CADisplayLink* _displayLink;
    
    __weak UIView* _sourceView;
    UIView * _view;
}

@synthesize ABI36_0_0ReactTag = _ABI36_0_0ReactTag;

static NSArray* _imageResolvers;

+ (void) setImageResolvers:(NSArray*) imageResolvers
{
    _imageResolvers = imageResolvers;
}

- (instancetype)init:(NSNumber *)ABI36_0_0ReactTag view:(UIView*) view isParent:(BOOL)isParent
{
    _ABI36_0_0ReactTag = ABI36_0_0ReactTag;
    _sourceView = view;
    _isParent = isParent;
    _refCount = 1;
    _hideRefCount = 0;
    _contentRequests = nil;
    _contentCache = nil;
    _contentTypeCache = ABI36_0_0RNSharedElementContentTypeNone;
    _styleRequests = nil;
    _styleCache = nil;
    _displayLink = nil;
    self.view = [ABI36_0_0RNSharedElementNode resolveView:_isParent ? _sourceView.subviews.firstObject : _sourceView];
    if (_isParent) [self addContentObservers:_sourceView];
    return self;
}

- (UIView*) view
{
    return _view;
}

- (void) setView:(UIView*) view
{
    if (_view == view) return;
    
    if (_view != nil) {
        if (_hideRefCount) _view.hidden = NO;
        [self removeContentObservers: _view];
    }
    _view = view;
    if (_view != nil) {
        if (_hideRefCount) _view.hidden = YES;
        [self addContentObservers:_view];
    }
}

+ (UIView*) resolveView:(UIView*) view
{
    if (view == nil || _imageResolvers == nil) return view;
 
    // In case the view contains a single UIImageView child
    // which is also the same size as the parent, then
    // use child image-view. This fixes <ImageBackground>.
    if (view.subviews.count == 1) {
        UIView* subview = view.subviews.firstObject;
        if ([subview isKindOfClass:[UIImageView class]]) {
            if (CGRectEqualToRect(subview.frame, view.bounds)) {
                return subview;
            }
        }
    }
    
    // Resolve the underlying ImageViews of well known
    // ABI36_0_0React-native libs (e.g. ABI36_0_0React-native-fast-image)
    for (NSArray* imageResolver in _imageResolvers) {
        NSArray* subviews = @[view];
        UIView* foundImageView = nil;
        for (NSString* name in imageResolver) {
            foundImageView = nil;
            for (UIView* subview in subviews) {
                if ([name isEqualToString:NSStringFromClass(subview.class)]) {
                    foundImageView = subview;
                    subviews = subview.subviews;
                    break;
                }
            }
        }
        if (foundImageView != nil) return foundImageView;
    }
    return view;
}

- (void) addContentObservers:(UIView*)view
{
    [view addObserver:self forKeyPath:@"bounds" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
    [view addObserver:self forKeyPath:@"frame" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
    
    if ([view isKindOfClass:[UIImageView class]]) {
        UIImageView* imageView = (UIImageView*) view;
        [imageView addObserver:self forKeyPath:@"image" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
    }
}

- (void) removeContentObservers:(UIView*)view
{
    [view removeObserver:self forKeyPath:@"bounds"];
    [view removeObserver:self forKeyPath:@"frame"];
    
    if ([view isKindOfClass:[UIImageView class]]) {
        UIImageView* imageView = (UIImageView*) view;
        [imageView removeObserver:self forKeyPath:@"image"];
    }
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
    //NSLog(@"observeValueForKeyPath: %@, changed: %@", keyPath, change);
    self.view = [ABI36_0_0RNSharedElementNode resolveView:_isParent ? _sourceView.subviews.firstObject : _sourceView];
    [self updateStyle];
    [self updateContent];
}

- (void) setRefCount:(long)refCount {
    _refCount = refCount;
    if (_refCount == 0) {
        if (_displayLink != nil) {
            [_displayLink removeFromRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
            _displayLink = nil;
        }
        self.view = nil;
        if (_isParent && (_sourceView != nil)) {
            [self removeContentObservers:_sourceView];
        }
    }
}

- (long) refCount {
    return _refCount;
}

- (void) setHideRefCount:(long)refCount
{
    _hideRefCount = refCount;
    if (_hideRefCount == 1) {
        if (_view != nil) _view.hidden = YES;
    }
    else if (_hideRefCount == 0) {
        if (_view != nil) _view.hidden = NO;
    }
}

- (long) hideRefCount
{
    return _hideRefCount;
}

- (void) requestContent:(__weak id <ABI36_0_0RNSharedElementDelegate>) delegate
{
    if (_contentCache != nil) {
        [delegate didLoadContent:_contentCache contentType:_contentTypeCache node:self];
        return;
    }
    
    if (_contentRequests == nil) _contentRequests = [[NSMutableArray alloc]init];
    [_contentRequests addObject:delegate];
    
    [self updateContent];
}

- (void) updateContent
{
    UIView* view = self.view;
    if (view == nil) return;
    if (_contentRequests == nil) return;
    
    CGRect bounds = view.bounds;
    if (!bounds.size.width || !bounds.size.height) {
        return;
    }
    
    // Obtain snapshot content
    NSObject* content;
    ABI36_0_0RNSharedElementContentType contentType;
    if ([view isKindOfClass:[UIImageView class]]) {
        UIImageView* imageView = (UIImageView*) view;
        UIImage* image = imageView.image;
        content = image;
        contentType = ABI36_0_0RNSharedElementContentTypeRawImage;
    }
    else if ([NSStringFromClass(view.class) isEqualToString:@"ABI36_0_0RCTView"] && !view.subviews.count) {
        content = [[UIView alloc]init];
        contentType = ABI36_0_0RNSharedElementContentTypeSnapshotView;
    }
    else {
        UIView* snapshotView = [_view snapshotViewAfterScreenUpdates:NO];
        content = snapshotView;
        contentType = ABI36_0_0RNSharedElementContentTypeSnapshotView;
    }
    /*else {
        NSLog(@"drawViewHierarchyInRect: bounds: %@", NSStringFromCGRect(bounds));
        UIGraphicsBeginImageContextWithOptions(bounds.size, NO, 0.0f);
        BOOL res = [view drawViewHierarchyInRect:bounds afterScreenUpdates:NO]; // NEVER USE YES, IT CREATED VISUAL ABI36_0_0ARTEFACTS ON THE CREEN
        UIImage* image = res ? UIGraphicsGetImageFromCurrentImageContext() : nil;
        UIGraphicsEndImageContext();
        NSLog(@"drawViewHierarchyInRect: RESULT: %li", res);
        content = image;
        contentType = ABI36_0_0RNSharedElementContentTypeSnapshotImage;
    }*/
    
    // If the content could not be obtained, then try again later
    if (content == nil) {
        if (_displayLink == nil) {
            _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(onDisplayLinkUpdate:)];
            [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
        }
        return;
    }
    //NSLog(@"Content fetched: %@, contentType: %d, size: %@", content, contentType, NSStringFromCGSize(bounds.size));
    
    _contentCache = content;
    _contentTypeCache = contentType;
    
    NSArray* delegates = _contentRequests;
    _contentRequests = nil;
    if (_displayLink != nil) {
        [_displayLink removeFromRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
        _displayLink = nil;
    }
    for (__weak id <ABI36_0_0RNSharedElementDelegate> delegate in delegates) {
        if (delegate != nil) {
            [delegate didLoadContent:content contentType:contentType node:self];
        }
    }
}

- (void)onDisplayLinkUpdate:(CADisplayLink *)sender
{
    // NSLog(@"onDisplayLinkUpdate");
    [self updateContent];
}

- (void) requestStyle:(__weak id <ABI36_0_0RNSharedElementDelegate>) delegate
{
    if (_styleCache != nil) {
        [delegate didLoadStyle:_styleCache node:self];
        return;
    }
    
    if (_styleRequests == nil) _styleRequests = [[NSMutableArray alloc]init];
    [_styleRequests addObject:delegate];
    
    [self updateStyle];
}

- (void) updateStyle
{
    UIView* view = self.view;
    if (_styleRequests == nil) return;
    if (view == nil) return;
    
    // Get absolute layout
    CGRect layout = [view convertRect:view.bounds toView:nil];
    if (CGRectIsEmpty(layout)) return;
    
    // Create style
    ABI36_0_0RNSharedElementStyle* style = [[ABI36_0_0RNSharedElementStyle alloc]init];
    CALayer* layer = view.layer;
    style.view = view;
    style.layout = layout;
    style.size = view.bounds.size;
    style.transform = [ABI36_0_0RNSharedElementStyle getAbsoluteViewTransform:view];
    style.contentMode = view.contentMode;
    style.opacity = layer.opacity;
    style.cornerRadius = layer.cornerRadius;
    style.borderWidth = layer.borderWidth;
    style.borderColor = layer.borderColor ? [UIColor colorWithCGColor:layer.borderColor] : [UIColor clearColor];
    style.backgroundColor = layer.backgroundColor ? [UIColor colorWithCGColor:layer.backgroundColor] : [UIColor clearColor];
    style.shadowColor = layer.shadowColor ? [UIColor colorWithCGColor:layer.shadowColor] : [UIColor clearColor];
    style.shadowOffset = layer.shadowOffset;
    style.shadowRadius = layer.shadowRadius;
    style.shadowOpacity = layer.shadowOpacity;
    
    /*NSLog(@"Style fetched: %@, realSize: %@, opacity: %lf, transform: %@", NSStringFromCGRect(layout), NSStringFromCGSize(view.bounds.size), style.opacity, [ABI36_0_0RNSharedElementStyle stringFromTransform:style.transform]);*/
    
    _styleCache = style;
    
    NSArray* delegates = _styleRequests;
    _styleRequests = nil;
    for (__weak id <ABI36_0_0RNSharedElementDelegate> delegate in delegates) {
        if (delegate != nil) {
            [delegate didLoadStyle:style node:self];
        }
    }
}

- (void) cancelRequests:(id <ABI36_0_0RNSharedElementDelegate>) delegate
{
    if (_styleRequests != nil) [_styleRequests removeObject:delegate];
    if (_contentRequests != nil) [_contentRequests removeObject:delegate];
}

@end
