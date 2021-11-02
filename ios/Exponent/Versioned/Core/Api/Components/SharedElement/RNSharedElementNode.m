//
//  RNSharedElementNode.m
//  react-native-shared-element
//

#import <UIKit/UIKit.h>
#import <React/RCTView.h>
#import "RNSharedElementNode.h"
#import "RNSharedElementContent.h"
#import <QuartzCore/QuartzCore.h>

@interface RNSharedElementNodeResolvedSource : NSObject
@property (nonatomic, readonly) UIView* view;
@property (nonatomic, readonly) BOOL hasChildImageView;
- (instancetype)initWithView:(UIView*) view hasChildImageView:(BOOL)hasChildImageView;
@end
@implementation RNSharedElementNodeResolvedSource
- (instancetype)initWithView:(UIView*) view hasChildImageView:(BOOL)hasChildImageView
{
  _view = view;
  _hasChildImageView = hasChildImageView;
  return self;
}
+ (instancetype)sourceWithView:(UIView*) view {
  return [[RNSharedElementNodeResolvedSource alloc]initWithView:view hasChildImageView:NO];
}
+ (instancetype)sourceWithView:(UIView*) view hasChildImageView:(BOOL)hasChildImageView {
  return [[RNSharedElementNodeResolvedSource alloc]initWithView:view hasChildImageView:hasChildImageView];
}
- (UIView*) contentView {
  return (_hasChildImageView && _view.subviews.count) ? _view.subviews[0] : _view;
}
@end

@implementation RNSharedElementNode
{
  long _refCount;
  long _hideRefCount;
  
  NSMutableArray* _contentRequests;
  RNSharedElementContent* _contentCache;
  CFTimeInterval _contentCacheTimeInterval;
  
  NSMutableArray* _styleRequests;
  RNSharedElementStyle* _styleCache;
  CFTimeInterval _styleCacheTimeInterval;
  
  CADisplayLink* _displayLink;
  
  __weak UIView* _sourceView;
  RNSharedElementNodeResolvedSource* _resolvedSource;
}

@synthesize reactTag = _reactTag;

NSArray* _imageResolvers;

+ (void) setImageResolvers:(NSArray*) imageResolvers
{
  _imageResolvers = imageResolvers;
}

- (instancetype)init:(NSNumber *)reactTag view:(UIView*) view isParent:(BOOL)isParent
{
  _reactTag = reactTag;
  _sourceView = view;
  _isParent = isParent;
  _refCount = 1;
  _hideRefCount = 0;
  _contentRequests = nil;
  _contentCache = nil;
  _contentCacheTimeInterval = 0.0;
  _styleRequests = nil;
  _styleCache = nil;
  _styleCacheTimeInterval = 0.0;
  _displayLink = nil;
  _resolvedSource = [RNSharedElementNodeResolvedSource sourceWithView:nil];
  [self updateResolvedSource:YES];
  if (_isParent) [self addStyleObservers:_sourceView];
  return self;
}

- (UIView*) view
{
  return _resolvedSource ? _resolvedSource.view : nil;
}

- (void) updateResolvedSource:(BOOL)noReset
{
  RNSharedElementNodeResolvedSource* resolvedSource = noReset
  ? [RNSharedElementNode resolveSource:_isParent ? _sourceView.subviews.firstObject : _sourceView]
  : [RNSharedElementNodeResolvedSource sourceWithView:nil];
  
  if ((_resolvedSource.view == resolvedSource.view) && (_resolvedSource.contentView == resolvedSource.contentView)) return;
  
  // Remove old observers
  if (_resolvedSource.view != nil && _resolvedSource.view != resolvedSource.view) {
    if (_hideRefCount) _resolvedSource.view.hidden = NO;
    [self removeStyleObservers: _resolvedSource.view];
  }
  if (_resolvedSource.contentView != nil && _resolvedSource.contentView != resolvedSource.contentView) {
    [self removeContentObservers: _resolvedSource.contentView];
  }
  
  // Add new observers
  if (resolvedSource.view != nil && _resolvedSource.view != resolvedSource.view) {
    if (_hideRefCount) resolvedSource.view.hidden = YES;
    [self addStyleObservers:resolvedSource.view];
  }
  if (resolvedSource.contentView != nil && _resolvedSource.contentView != resolvedSource.contentView) {
    [self addContentObservers:resolvedSource.contentView];
  }
  
  // Update resolved source
  _resolvedSource = resolvedSource;
}

+ (RNSharedElementNodeResolvedSource*) resolveSource:(UIView*) view
{
  if (view == nil || _imageResolvers == nil) return [RNSharedElementNodeResolvedSource sourceWithView:view];
  
  // If the view is an ImageView, then use that.
  if ([RNSharedElementContent isKindOfImageView:view]) {
    return [RNSharedElementNodeResolvedSource sourceWithView:view];
  }
  
  // In case the view contains a single UIImageView child
  // which is also the same size as the parent, then
  // use child image-view. This fixes <ImageBackground>.
  UIView* subview = view;
  for (int i = 0; i < 2; i++) {
    if (subview.subviews.count != 1) break;
    subview = subview.subviews.firstObject;
    if ([RNSharedElementContent isKindOfImageView:subview]) {
      CGRect bounds = view.bounds;
      if ([view isKindOfClass:[RCTView class]]) {
        RCTView* rctView = (RCTView*) view;
        CGFloat borderWidth = rctView.borderWidth;
        if (borderWidth > 0.0f) {
          bounds.origin.x += borderWidth;
          bounds.origin.y += borderWidth;
          bounds.size.width -= (borderWidth * 2.0f);
          bounds.size.height -= (borderWidth * 2.0f);
        }
      }
      if (CGRectEqualToRect(subview.frame, bounds)) {
        //NSLog(@"RESOLVED IMAGE VIEW, frame: %@, bounds: %@", NSStringFromCGRect(subview.frame), NSStringFromCGRect(bounds));
        return [RNSharedElementNodeResolvedSource sourceWithView:view hasChildImageView:YES];
      }
    }
  }
  
  // Resolve the underlying ImageViews of well known
  // react-native libs (e.g. react-native-fast-image)
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
    if (foundImageView != nil) {
      return [RNSharedElementNodeResolvedSource sourceWithView:foundImageView];
    }
  }
  return [RNSharedElementNodeResolvedSource sourceWithView:view];
}

- (void) addStyleObservers:(UIView*)view
{
  [view addObserver:self forKeyPath:@"bounds" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
  [view addObserver:self forKeyPath:@"frame" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
}

- (void) removeStyleObservers:(UIView*)view
{
  [view removeObserver:self forKeyPath:@"bounds"];
  [view removeObserver:self forKeyPath:@"frame"];
}

- (void) addContentObservers:(UIView*)view
{
  if ([RNSharedElementContent isKindOfImageView:view]) {
    UIImageView* imageView = [RNSharedElementContent imageViewFromView:view];
    [imageView addObserver:self forKeyPath:@"image" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
  }
}

- (void) removeContentObservers:(UIView*)view
{
  if ([RNSharedElementContent isKindOfImageView:view]) {
    UIImageView* imageView = [RNSharedElementContent imageViewFromView:view];
    [imageView removeObserver:self forKeyPath:@"image"];
  }
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  //NSLog(@"observeValueForKeyPath: %@, changed: %@", keyPath, change);
  if ([keyPath isEqualToString:@"image"]) {
    [self updateContent];
  } else {
    [self updateStyle];
  }
}

- (void) setRefCount:(long)refCount {
  _refCount = refCount;
  if (_refCount == 0) {
    if (_displayLink != nil) {
      [_displayLink removeFromRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
      _displayLink = nil;
    }
    [self updateResolvedSource:NO];
    if (_isParent && (_sourceView != nil)) {
      [self removeStyleObservers:_sourceView];
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
    if (_resolvedSource.view != nil) _resolvedSource.view.hidden = YES;
  }
  else if (_hideRefCount == 0) {
    if (_resolvedSource.view != nil) _resolvedSource.view.hidden = NO;
  }
}

- (long) hideRefCount
{
  return _hideRefCount;
}

- (void) requestContent:(__weak id <RNSharedElementDelegate>) delegate
{
  if (_contentCache != nil && ((CACurrentMediaTime() - _contentCacheTimeInterval) <= 0.3)) {
    [delegate didLoadContent:_contentCache node:self];
    return;
  }
  
  if (_contentRequests == nil) _contentRequests = [[NSMutableArray alloc]init];
  [_contentRequests addObject:delegate];
  
  [self updateContent];
}

- (void) updateContent
{
  // Update the resolved source
  [self updateResolvedSource:YES];
  RNSharedElementNodeResolvedSource* resolvedSource = _resolvedSource;
  UIView* view = resolvedSource.view;
  UIView* contentView = resolvedSource.contentView;
  if (view == nil) return;
  if (_contentRequests == nil) return;
  
  CGRect bounds = view.bounds;
  CGRect frame = contentView.frame;
  if (!bounds.size.width || !bounds.size.height) {
    return;
  }
  
  // Obtain snapshot content
  RNSharedElementContent* content;
  if ([RNSharedElementContent isKindOfImageView:contentView]) {
    UIImageView* imageView = [RNSharedElementContent imageViewFromView:contentView];
    UIImage* image = imageView.image;
    UIEdgeInsets imageInsets = UIEdgeInsetsZero;
    if (contentView != view) {
      imageInsets.left = frame.origin.x;
      imageInsets.top = frame.origin.y;
      imageInsets.right = bounds.size.width - frame.size.width - frame.origin.x;
      imageInsets.bottom = bounds.size.height - frame.size.height - frame.origin.y;
    }
    content = [[RNSharedElementContent alloc]initWithData:image type:RNSharedElementContentTypeRawImage insets:imageInsets];
  }
  else if ([NSStringFromClass(view.class) isEqualToString:@"RCTView"] && !view.subviews.count) {
    UIView* dummyView = [[UIView alloc]init];
    content = [[RNSharedElementContent alloc]initWithData:dummyView type:RNSharedElementContentTypeSnapshotView insets:UIEdgeInsetsZero];
  }
  else {
    UIView* snapshotView = [view snapshotViewAfterScreenUpdates:NO];
    content = [[RNSharedElementContent alloc]initWithData:snapshotView type:RNSharedElementContentTypeSnapshotView insets:UIEdgeInsetsZero];
  }
  /*else {
   NSLog(@"drawViewHierarchyInRect: bounds: %@", NSStringFromCGRect(bounds));
   UIGraphicsBeginImageContextWithOptions(bounds.size, NO, 0.0f);
   BOOL res = [view drawViewHierarchyInRect:bounds afterScreenUpdates:NO]; // NEVER USE YES, IT CREATED VISUAL ARTEFACTS ON THE CREEN
   UIImage* image = res ? UIGraphicsGetImageFromCurrentImageContext() : nil;
   UIGraphicsEndImageContext();
   NSLog(@"drawViewHierarchyInRect: RESULT: %li", res);
   content = image;
   contentType = RNSharedElementContentTypeSnapshotImage;
   }*/
  
  // If the content could not be obtained, then try again later
  if (content == nil || content.data == nil) {
    return [self updateRetryLoop];
  }
  // NSLog(@"Content fetched: %@, size: %@", content, NSStringFromCGSize(bounds.size));
  
  _contentCache = content;
  _contentCacheTimeInterval = CACurrentMediaTime();
  
  NSArray* delegates = _contentRequests;
  _contentRequests = nil;
  [self updateRetryLoop];
  for (__weak id <RNSharedElementDelegate> delegate in delegates) {
    if (delegate != nil) {
      [delegate didLoadContent:content node:self];
    }
  }
}

- (void) requestStyle:(__weak id <RNSharedElementDelegate>) delegate
{
  if (_styleCache != nil && ((CACurrentMediaTime() - _styleCacheTimeInterval) <= 0.3)) {
    [delegate didLoadStyle:_styleCache node:self];
    return;
  }
  
  if (_styleRequests == nil) _styleRequests = [[NSMutableArray alloc]init];
  [_styleRequests addObject:delegate];
  
  [self updateStyle];
}

- (void) updateStyle
{
  [self updateResolvedSource:YES];
  RNSharedElementNodeResolvedSource* resolvedSource = _resolvedSource;
  UIView* view = resolvedSource.view;
  UIView* contentView = resolvedSource.contentView;
  if (_styleRequests == nil) return;
  if (view == nil) return;
  
  // If the window could not be obtained, then try again later
  if (view.window == nil) {
    return [self updateRetryLoop];
  }
  
  // Get absolute layout
  CGRect layout = [view convertRect:view.bounds toView:nil];
  if (CGRectIsEmpty(layout)) return;
  
  // Create style
  RNSharedElementStyle* style = [[RNSharedElementStyle alloc]initWithView:view];
  style.layout = layout;
  if ([RNSharedElementContent isKindOfImageView:contentView]) {
    UIImageView* imageView = [RNSharedElementContent imageViewFromView:contentView];
    style.contentMode = imageView.contentMode;
  } else {
    style.contentMode = view.contentMode;
  }
  /* NSLog(@"Style fetched, window: %@, alpha: %f, hidden: %@, parent: %@, layout: %@, realSize: %@, opacity: %lf, transform: %@, borderWidth: %lf, contentMode: %ld", view.window, view.alpha, @(view.hidden), @(_isParent), NSStringFromCGRect(layout), NSStringFromCGSize(style.size), style.opacity, [RNSharedElementStyle stringFromTransform:style.transform], style.borderWidth, style.contentMode); */
  
  _styleCache = style;
  _styleCacheTimeInterval = CACurrentMediaTime();
  
  NSArray* delegates = _styleRequests;
  _styleRequests = nil;
  [self updateRetryLoop];
  for (__weak id <RNSharedElementDelegate> delegate in delegates) {
    if (delegate != nil) {
      [delegate didLoadStyle:style node:self];
    }
  }
}

- (void) cancelRequests:(id <RNSharedElementDelegate>) delegate
{
  if (_styleRequests != nil) [_styleRequests removeObject:delegate];
  if (_contentRequests != nil) [_contentRequests removeObject:delegate];
}

- (void)updateRetryLoop
{
  BOOL shouldRun = _styleRequests != nil || _contentRequests != nil;
  if (shouldRun && _displayLink == nil) {
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(onDisplayLinkUpdate:)];
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
  } else if (!shouldRun && _displayLink != nil) {
    [_displayLink removeFromRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
    _displayLink = nil;
  }
}

- (void)onDisplayLinkUpdate:(CADisplayLink *)sender
{
  // NSLog(@"onDisplayLinkUpdate");
  if (_styleRequests != nil) [self updateStyle];
  if (_contentRequests != nil) [self updateContent];
}

@end
