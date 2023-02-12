//
//  ABI48_0_0RNSharedElementNode.m
//  ABI48_0_0React-native-shared-element
//

#import <UIKit/UIKit.h>
#import <ABI48_0_0React/ABI48_0_0RCTView.h>
#import "ABI48_0_0RNSharedElementNode.h"
#import "ABI48_0_0RNSharedElementContent.h"
#import <QuartzCore/QuartzCore.h>

@interface ABI48_0_0RNSharedElementNodeResolvedSource : NSObject
@property (nonatomic, readonly) UIView* view;
@property (nonatomic, readonly) BOOL hasChildImageView;
- (instancetype)initWithView:(UIView*) view hasChildImageView:(BOOL)hasChildImageView;
@end
@implementation ABI48_0_0RNSharedElementNodeResolvedSource
- (instancetype)initWithView:(UIView*) view hasChildImageView:(BOOL)hasChildImageView
{
  _view = view;
  _hasChildImageView = hasChildImageView;
  return self;
}
+ (instancetype)sourceWithView:(UIView*) view {
  return [[ABI48_0_0RNSharedElementNodeResolvedSource alloc]initWithView:view hasChildImageView:NO];
}
+ (instancetype)sourceWithView:(UIView*) view hasChildImageView:(BOOL)hasChildImageView {
  return [[ABI48_0_0RNSharedElementNodeResolvedSource alloc]initWithView:view hasChildImageView:hasChildImageView];
}
- (UIView*) contentView {
  return (_hasChildImageView && _view.subviews.count) ? _view.subviews[0] : _view;
}
@end

@implementation ABI48_0_0RNSharedElementNode
{
  long _refCount;
  long _hideRefCount;
  
  NSMutableArray* _contentRequests;
  ABI48_0_0RNSharedElementContent* _contentCache;
  CFTimeInterval _contentCacheTimeInterval;
  
  NSMutableArray* _styleRequests;
  ABI48_0_0RNSharedElementStyle* _styleCache;
  CFTimeInterval _styleCacheTimeInterval;
  
  CADisplayLink* _displayLink;
  
  __weak UIView* _sourceView;
  ABI48_0_0RNSharedElementNodeResolvedSource* _resolvedSource;
}

@synthesize ABI48_0_0ReactTag = _ABI48_0_0ReactTag;

static NSArray* _imageResolvers;

+ (void) setImageResolvers:(NSArray*) imageResolvers
{
  _imageResolvers = imageResolvers;
}

- (instancetype)init:(NSNumber *)ABI48_0_0ReactTag view:(UIView*) view isParent:(BOOL)isParent
{
  _ABI48_0_0ReactTag = ABI48_0_0ReactTag;
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
  _resolvedSource = [ABI48_0_0RNSharedElementNodeResolvedSource sourceWithView:nil];
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
  ABI48_0_0RNSharedElementNodeResolvedSource* resolvedSource = noReset
  ? [ABI48_0_0RNSharedElementNode resolveSource:_isParent ? _sourceView.subviews.firstObject : _sourceView]
  : [ABI48_0_0RNSharedElementNodeResolvedSource sourceWithView:nil];
  
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

+ (ABI48_0_0RNSharedElementNodeResolvedSource*) resolveSource:(UIView*) view
{
  if (view == nil || _imageResolvers == nil) return [ABI48_0_0RNSharedElementNodeResolvedSource sourceWithView:view];
  
  // If the view is an ImageView, then use that.
  if ([ABI48_0_0RNSharedElementContent isKindOfImageView:view]) {
    return [ABI48_0_0RNSharedElementNodeResolvedSource sourceWithView:view];
  }
  
  // In case the view contains a single UIImageView child
  // which is also the same size as the parent, then
  // use child image-view. This fixes <ImageBackground>.
  UIView* subview = view;
  for (int i = 0; i < 2; i++) {
    if (subview.subviews.count != 1) break;
    subview = subview.subviews.firstObject;
    if ([ABI48_0_0RNSharedElementContent isKindOfImageView:subview]) {
      CGRect bounds = view.bounds;
      if ([view isKindOfClass:[ABI48_0_0RCTView class]]) {
        ABI48_0_0RCTView* rctView = (ABI48_0_0RCTView*) view;
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
        return [ABI48_0_0RNSharedElementNodeResolvedSource sourceWithView:view hasChildImageView:YES];
      }
    }
  }
  
  // Resolve the underlying ImageViews of well known
  // ABI48_0_0React-native libs (e.g. ABI48_0_0React-native-fast-image)
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
      return [ABI48_0_0RNSharedElementNodeResolvedSource sourceWithView:foundImageView];
    }
  }
  return [ABI48_0_0RNSharedElementNodeResolvedSource sourceWithView:view];
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
  if ([ABI48_0_0RNSharedElementContent isKindOfImageView:view]) {
    UIImageView* imageView = [ABI48_0_0RNSharedElementContent imageViewFromView:view];
    [imageView addObserver:self forKeyPath:@"image" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
  }
}

- (void) removeContentObservers:(UIView*)view
{
  if ([ABI48_0_0RNSharedElementContent isKindOfImageView:view]) {
    UIImageView* imageView = [ABI48_0_0RNSharedElementContent imageViewFromView:view];
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

- (void) requestContent:(__weak id <ABI48_0_0RNSharedElementDelegate>) delegate
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
  ABI48_0_0RNSharedElementNodeResolvedSource* resolvedSource = _resolvedSource;
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
  ABI48_0_0RNSharedElementContent* content;
  if ([ABI48_0_0RNSharedElementContent isKindOfImageView:contentView]) {
    UIImageView* imageView = [ABI48_0_0RNSharedElementContent imageViewFromView:contentView];
    UIImage* image = imageView.image;
    UIEdgeInsets imageInsets = UIEdgeInsetsZero;
    if (contentView != view) {
      imageInsets.left = frame.origin.x;
      imageInsets.top = frame.origin.y;
      imageInsets.right = bounds.size.width - frame.size.width - frame.origin.x;
      imageInsets.bottom = bounds.size.height - frame.size.height - frame.origin.y;
    }
    content = [[ABI48_0_0RNSharedElementContent alloc]initWithData:image type:ABI48_0_0RNSharedElementContentTypeRawImage insets:imageInsets];
  }
  else if ([NSStringFromClass(view.class) isEqualToString:@"ABI48_0_0RCTView"] && !view.subviews.count) {
    UIView* dummyView = [[UIView alloc]init];
    content = [[ABI48_0_0RNSharedElementContent alloc]initWithData:dummyView type:ABI48_0_0RNSharedElementContentTypeSnapshotView insets:UIEdgeInsetsZero];
  }
  else {
    UIView* snapshotView = [view snapshotViewAfterScreenUpdates:NO];
    content = [[ABI48_0_0RNSharedElementContent alloc]initWithData:snapshotView type:ABI48_0_0RNSharedElementContentTypeSnapshotView insets:UIEdgeInsetsZero];
  }
  /*else {
   NSLog(@"drawViewHierarchyInRect: bounds: %@", NSStringFromCGRect(bounds));
   UIGraphicsBeginImageContextWithOptions(bounds.size, NO, 0.0f);
   BOOL res = [view drawViewHierarchyInRect:bounds afterScreenUpdates:NO]; // NEVER USE YES, IT CREATED VISUAL ABI48_0_0ARTEFACTS ON THE CREEN
   UIImage* image = res ? UIGraphicsGetImageFromCurrentImageContext() : nil;
   UIGraphicsEndImageContext();
   NSLog(@"drawViewHierarchyInRect: RESULT: %li", res);
   content = image;
   contentType = ABI48_0_0RNSharedElementContentTypeSnapshotImage;
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
  for (__weak id <ABI48_0_0RNSharedElementDelegate> delegate in delegates) {
    if (delegate != nil) {
      [delegate didLoadContent:content node:self];
    }
  }
}

- (void) requestStyle:(__weak id <ABI48_0_0RNSharedElementDelegate>) delegate
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
  ABI48_0_0RNSharedElementNodeResolvedSource* resolvedSource = _resolvedSource;
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
  ABI48_0_0RNSharedElementStyle* style = [[ABI48_0_0RNSharedElementStyle alloc]initWithView:view];
  style.layout = layout;
  if ([ABI48_0_0RNSharedElementContent isKindOfImageView:contentView]) {
    UIImageView* imageView = [ABI48_0_0RNSharedElementContent imageViewFromView:contentView];
    style.contentMode = imageView.contentMode;
  } else {
    style.contentMode = view.contentMode;
  }
  /* NSLog(@"Style fetched, window: %@, alpha: %f, hidden: %@, parent: %@, layout: %@, realSize: %@, opacity: %lf, transform: %@, borderWidth: %lf, contentMode: %ld", view.window, view.alpha, @(view.hidden), @(_isParent), NSStringFromCGRect(layout), NSStringFromCGSize(style.size), style.opacity, [ABI48_0_0RNSharedElementStyle stringFromTransform:style.transform], style.borderWidth, style.contentMode); */
  
  _styleCache = style;
  _styleCacheTimeInterval = CACurrentMediaTime();
  
  NSArray* delegates = _styleRequests;
  _styleRequests = nil;
  [self updateRetryLoop];
  for (__weak id <ABI48_0_0RNSharedElementDelegate> delegate in delegates) {
    if (delegate != nil) {
      [delegate didLoadStyle:style node:self];
    }
  }
}

- (void) cancelRequests:(id <ABI48_0_0RNSharedElementDelegate>) delegate
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
