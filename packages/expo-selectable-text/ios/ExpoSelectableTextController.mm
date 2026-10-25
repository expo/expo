#import "ExpoSelectableTextController.h"
#import "ExpoSelectableTextSelectionView.h"

#import <React/RCTLog.h>
#import <React/RCTParagraphComponentView.h>
#import <react/renderer/components/text/ParagraphProps.h>
#import <react/renderer/textlayoutmanager/RCTTextLayoutManager.h>

using namespace facebook::react;

// The TextKit setup that `RCTParagraphTextView` draws with. The selection view
// lays out with the same call, so its glyphs land on the drawn glyphs.
@interface RCTTextLayoutManager (ExpoSelectableText)

- (NSTextStorage *)_textStorageAndLayoutManagerWithAttributesString:(NSAttributedString *)attributedString
                                                paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                                               size:(CGSize)size;

@end

@interface RCTParagraphComponentView (ExpoSelectableText)

- (ParagraphAttributes)expoSelectableText_paragraphAttributes;

@end

@implementation RCTParagraphComponentView (ExpoSelectableText)

- (ParagraphAttributes)expoSelectableText_paragraphAttributes
{
  return static_cast<const ParagraphProps &>(*_props).paragraphAttributes;
}

@end

// The selection layer lines up with the drawn text through two private React Native
// internals. Without them it uses public equivalents, which can be slightly off.
static BOOL ExpoSelectableTextHasReactNativeInternals(void)
{
  static BOOL hasInternals;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSMutableArray<NSString *> *missing = [NSMutableArray new];
    if (![NSClassFromString(@"RCTParagraphTextView") instancesRespondToSelector:NSSelectorFromString(@"drawingFrame")]) {
      [missing addObject:@"-[RCTParagraphTextView drawingFrame]"];
    }
    if (![RCTTextLayoutManager instancesRespondToSelector:@selector
                               (_textStorageAndLayoutManagerWithAttributesString:paragraphAttributes:size:)]) {
      [missing addObject:@"-[RCTTextLayoutManager _textStorageAndLayoutManagerWithAttributesString:paragraphAttributes:size:]"];
    }
    hasInternals = missing.count == 0;
    if (!hasInternals) {
      RCTLogWarn(
          @"SelectableText uses an approximate text layout because this React Native version does not have: %@. The selection highlight can be slightly off the drawn text.",
          [missing componentsJoinedByString:@", "]);
    }
  });
  return hasInternals;
}

// The frame the paragraph draws its glyphs into, in the paragraph's coordinates.
static CGRect ExpoSelectableTextDrawingFrame(UIView *contentView)
{
  CGRect drawingFrame = ExpoSelectableTextHasReactNativeInternals()
      ? [[contentView valueForKey:@"drawingFrame"] CGRectValue]
      : contentView.bounds;
  return CGRectOffset(drawingFrame, contentView.frame.origin.x, contentView.frame.origin.y);
}

static NSLineBreakMode ExpoSelectableTextLineBreakMode(EllipsizeMode ellipsizeMode)
{
  switch (ellipsizeMode) {
    case EllipsizeMode::Clip:
      return NSLineBreakByClipping;
    case EllipsizeMode::Head:
      return NSLineBreakByTruncatingHead;
    case EllipsizeMode::Middle:
      return NSLineBreakByTruncatingMiddle;
    case EllipsizeMode::Tail:
      return NSLineBreakByTruncatingTail;
  }
  return NSLineBreakByTruncatingTail;
}

// Same setup as `RCTTextLayoutManager`'s private method, without its baseline offset and
// `adjustsFontSizeToFit` scaling.
static NSTextStorage *ExpoSelectableTextStorage(
    RCTTextLayoutManager *layoutManager,
    NSAttributedString *attributedString,
    ParagraphAttributes paragraphAttributes,
    CGSize size)
{
  if (ExpoSelectableTextHasReactNativeInternals()) {
    return [layoutManager _textStorageAndLayoutManagerWithAttributesString:attributedString
                                                       paragraphAttributes:paragraphAttributes
                                                                      size:size];
  }
  NSTextContainer *textContainer = [[NSTextContainer alloc] initWithSize:size];
  textContainer.lineFragmentPadding = 0.0;
  textContainer.lineBreakMode = paragraphAttributes.maximumNumberOfLines > 0
      ? ExpoSelectableTextLineBreakMode(paragraphAttributes.ellipsizeMode)
      : NSLineBreakByClipping;
  textContainer.maximumNumberOfLines = paragraphAttributes.maximumNumberOfLines;
  NSLayoutManager *textLayoutManager = [NSLayoutManager new];
  textLayoutManager.usesFontLeading = NO;
  [textLayoutManager addTextContainer:textContainer];
  NSTextStorage *textStorage = [[NSTextStorage alloc] initWithAttributedString:attributedString];
  [textStorage addLayoutManager:textLayoutManager];
  return textStorage;
}

// The topmost paragraph under the point, skipping views that can't be touched.
static RCTParagraphComponentView *ExpoSelectableTextParagraphAtPoint(UIView *view, CGPoint point)
{
  if (view.hidden || view.alpha < 0.01 || !view.userInteractionEnabled || ![view pointInside:point withEvent:nil]) {
    return nil;
  }
  if ([view isKindOfClass:[RCTParagraphComponentView class]]) {
    return (RCTParagraphComponentView *)view;
  }
  for (UIView *subview in view.subviews.reverseObjectEnumerator) {
    RCTParagraphComponentView *paragraph =
        ExpoSelectableTextParagraphAtPoint(subview, [view convertPoint:point toView:subview]);
    if (paragraph != nil) {
      return paragraph;
    }
  }
  return nil;
}

@implementation ExpoSelectableTextController {
  __weak UIView *_hostView;
  __weak RCTParagraphComponentView *_paragraph;
  ExpoSelectableTextSelectionView *_selectionView;
  RCTTextLayoutManager *_selectionLayoutManager;
  NSAttributedString *_selectionLayoutText;
  CGSize _selectionLayoutSize;
  ParagraphAttributes _selectionParagraphAttributes;
  NSArray<UIGestureRecognizer *> *_disabledRecognizers;
  NSTimer *_syncTimer;
}

- (instancetype)initWithHostView:(UIView *)hostView
{
  if (self = [super init]) {
    _hostView = hostView;
    _menuItems = @[];
  }
  return self;
}

- (void)dealloc
{
  [self _detach];
}

- (void)setMenuItems:(NSArray<NSDictionary *> *)menuItems
{
  _menuItems = [menuItems copy];
  _selectionView.menuItems = _menuItems;
}

// The selection view costs a text view and a second TextKit layout, so it is
// made when a touch reaches a paragraph, not for every paragraph on screen.
// UIKit hit-tests before it assigns the touch, so the same touch goes to the new
// view and its long press can start a selection.
- (void)prepareForTouchAtPoint:(CGPoint)point withEvent:(UIEvent *)event
{
  UIView *hostView = _hostView;
  if (hostView == nil) {
    return;
  }
  RCTParagraphComponentView *paragraph = ExpoSelectableTextParagraphAtPoint(hostView, point);
  if (_paragraph != nil && ![_paragraph isDescendantOfView:hostView]) {
    [self _detach];
  }
  if (paragraph != _paragraph && ![self _isNearSelectionAtPoint:point]) {
    // A touch on another paragraph moves the selection there.
    [_selectionView resignFirstResponder];
    [self _detach];
  }
  if (paragraph != nil && _paragraph == nil) {
    [self _attachToParagraph:paragraph];
  }
  if (paragraph != nil && paragraph == _paragraph) {
    [self _updateSelectionView];
  }
}

// The selection handles reach outside the text, so a touch on a handle keeps the
// selection, even when it lands on another paragraph.
- (BOOL)_isNearSelectionAtPoint:(CGPoint)point
{
  UIView *hostView = _hostView;
  UITextRange *selectedRange = _selectionView.selectedTextRange;
  if (!_selectionView.isFirstResponder || hostView == nil || selectedRange == nil || selectedRange.isEmpty) {
    return NO;
  }
  CGPoint pointInSelectionView = [hostView convertPoint:point toView:_selectionView];
  for (UITextSelectionRect *selectionRect in [_selectionView selectionRectsForRange:selectedRange]) {
    // The start handle's knob is above the text and the end handle's is below it.
    CGRect rect = selectionRect.rect;
    if (selectionRect.containsStart &&
        CGRectContainsPoint(UIEdgeInsetsInsetRect(rect, UIEdgeInsetsMake(-24, -16, -4, -16)), pointInSelectionView)) {
      return YES;
    }
    if (selectionRect.containsEnd &&
        CGRectContainsPoint(UIEdgeInsetsInsetRect(rect, UIEdgeInsetsMake(-4, -16, -24, -16)), pointInSelectionView)) {
      return YES;
    }
  }
  return NO;
}

- (void)reset
{
  [self _detach];
}

#pragma mark - Attaching

- (void)_attachToParagraph:(RCTParagraphComponentView *)paragraph
{
  _paragraph = paragraph;
  // A `selectable` <Text> adds a long press that copies the whole paragraph. The
  // selection view's long press replaces it.
  NSMutableArray<UIGestureRecognizer *> *disabled = [NSMutableArray new];
  for (UIGestureRecognizer *recognizer in paragraph.gestureRecognizers) {
    if ([recognizer isKindOfClass:[UILongPressGestureRecognizer class]] && recognizer.enabled) {
      recognizer.enabled = NO;
      [disabled addObject:recognizer];
    }
  }
  _disabledRecognizers = disabled;
}

- (void)_detach
{
  for (UIGestureRecognizer *recognizer in _disabledRecognizers) {
    recognizer.enabled = YES;
  }
  _disabledRecognizers = nil;
  [self _stopSync];
  [_selectionView removeFromSuperview];
  _selectionView = nil;
  _selectionLayoutText = nil;
  _selectionLayoutSize = CGSizeZero;
  _paragraph = nil;
}

#pragma mark - Selection view

- (void)_updateSelectionView
{
  RCTParagraphComponentView *paragraph = _paragraph;
  UIView *contentView = paragraph.contentView;
  NSAttributedString *attributedText = paragraph.attributedText;
  if (paragraph == nil || attributedText.length == 0 || contentView.superview == nil) {
    [self _detach];
    return;
  }

  CGRect drawingFrame = ExpoSelectableTextDrawingFrame(contentView);
  if (CGRectIsEmpty(drawingFrame)) {
    [self _detach];
    return;
  }

  // A press on a nested pressable <Text> paints a highlight. Comparing the
  // unpainted string keeps that from rebuilding the view in the middle of a touch.
  NSAttributedString *layoutText = ExpoSelectableTextUnpaintedString(attributedText);
  ParagraphAttributes paragraphAttributes = [paragraph expoSelectableText_paragraphAttributes];
  // `UITextView` binds its text container at initialization. The container's line
  // limit and break mode come from the paragraph attributes, so a change of those
  // needs a new view.
  BOOL needsNewView = _selectionView == nil || !(paragraphAttributes == _selectionParagraphAttributes);
  BOOL layoutChanged = ![layoutText isEqualToAttributedString:_selectionLayoutText] ||
      !CGSizeEqualToSize(drawingFrame.size, _selectionLayoutSize);

  if (needsNewView || layoutChanged) {
    if (_selectionLayoutManager == nil) {
      _selectionLayoutManager = [RCTTextLayoutManager new];
    }
    NSTextStorage *textStorage =
        ExpoSelectableTextStorage(_selectionLayoutManager, layoutText, paragraphAttributes, drawingFrame.size);
    if (needsNewView) {
      [_selectionView removeFromSuperview];
      _selectionView = [[ExpoSelectableTextSelectionView alloc]
          initWithFrame:drawingFrame
          textContainer:textStorage.layoutManagers.firstObject.textContainers.firstObject];
      _selectionView.menuItems = _menuItems;
      __weak __typeof(self) weakSelf = self;
      _selectionView.onMenuAction = ^(NSString *actionId, NSRange range) {
        [weakSelf _dispatchMenuAction:actionId range:range];
      };
      _selectionView.onFirstResponderChange = ^(BOOL isFirstResponder) {
        [weakSelf _selectionViewFirstResponderDidChange:isFirstResponder];
      };
      // React Native recycles the paragraph when its <Text> unmounts. The layer
      // must not stay in it for the next <Text>.
      __weak ExpoSelectableTextSelectionView *weakSelectionView = _selectionView;
      _selectionView.onRemovedFromWindow = ^{
        [weakSelf _selectionViewWasRemovedFromWindow:weakSelectionView];
      };
      // Under the drawn text. `RCTParagraphTextView` returns nil from `hitTest:`,
      // so the selection view gets the touches, and React Native still finds the
      // paragraph's nested <Text> for them.
      [contentView.superview insertSubview:_selectionView belowSubview:contentView];
      _selectionParagraphAttributes = paragraphAttributes;
    } else {
      // Text that streams in changes on every update. Updating the text view in
      // place keeps the selection and a gesture that is in progress.
      NSRange selectedRange = _selectionView.selectedRange;
      ExpoSelectableTextSelectionView *selectionView = _selectionView;
      [selectionView performProgrammaticChange:^{
        selectionView.textContainer.size = drawingFrame.size;
        [selectionView.textStorage setAttributedString:textStorage];
        if (selectedRange.length > 0 && NSMaxRange(selectedRange) <= textStorage.length) {
          selectionView.selectedRange = selectedRange;
        }
      }];
    }
    _selectionLayoutText = [layoutText copy];
    _selectionLayoutSize = drawingFrame.size;
  }

  _selectionView.frame = drawingFrame;
  _selectionView.sourceAttributedText = attributedText;
}

- (void)_selectionViewWasRemovedFromWindow:(ExpoSelectableTextSelectionView *)selectionView
{
  if (selectionView != nil && selectionView == _selectionView) {
    [self _detach];
  }
}

// The host doesn't see the paragraph's updates, so while a selection is shown
// the layer follows the text, for example a message that streams in.
- (void)_selectionViewFirstResponderDidChange:(BOOL)isFirstResponder
{
  if (isFirstResponder) {
    if (_syncTimer == nil) {
      __weak __typeof(self) weakSelf = self;
      _syncTimer = [NSTimer timerWithTimeInterval:0.25
                                          repeats:YES
                                            block:^(NSTimer *timer) {
                                              [weakSelf _updateSelectionView];
                                            }];
      // Common modes keep it running while a list scrolls.
      [NSRunLoop.mainRunLoop addTimer:_syncTimer forMode:NSRunLoopCommonModes];
    }
  } else {
    [self _stopSync];
  }
}

- (void)_stopSync
{
  [_syncTimer invalidate];
  _syncTimer = nil;
}

#pragma mark - Events

- (void)_dispatchMenuAction:(NSString *)actionId range:(NSRange)range
{
  NSString *text = _paragraph.attributedText.string;
  if (self.onMenuAction == nil || text == nil || NSMaxRange(range) > text.length) {
    return;
  }
  self.onMenuAction(actionId, [text substringWithRange:range], range.location, NSMaxRange(range));
}

@end
