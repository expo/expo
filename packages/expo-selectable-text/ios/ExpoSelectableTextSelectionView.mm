#import "ExpoSelectableTextSelectionView.h"

#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTViewComponentView.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>

NSAttributedString *ExpoSelectableTextUnpaintedString(NSAttributedString *attributedString)
{
  NSMutableAttributedString *unpainted = [attributedString mutableCopy];
  NSRange range = NSMakeRange(0, unpainted.length);

  [unpainted beginEditing];
  [unpainted addAttribute:NSForegroundColorAttributeName value:UIColor.clearColor range:range];
  [unpainted addAttribute:NSBackgroundColorAttributeName value:UIColor.clearColor range:range];
  [unpainted removeAttribute:NSUnderlineStyleAttributeName range:range];
  [unpainted removeAttribute:NSStrikethroughStyleAttributeName range:range];
  [unpainted removeAttribute:NSShadowAttributeName range:range];
  [unpainted removeAttribute:RCTAttributedStringIsHighlightedAttributeName range:range];
  [unpainted endEditing];

  return unpainted;
}

@implementation ExpoSelectableTextSelectionView {
  UITapGestureRecognizer *_dismissSelectionRecognizer;
  BOOL _isProgrammaticChange;
}

- (void)performProgrammaticChange:(void (^)(void))change
{
  _isProgrammaticChange = YES;
  change();
  _isProgrammaticChange = NO;
}

- (instancetype)initWithFrame:(CGRect)frame textContainer:(NSTextContainer *)textContainer
{
  if (self = [super initWithFrame:frame textContainer:textContainer]) {
    _menuItems = @[];
    self.backgroundColor = UIColor.clearColor;
    self.editable = NO;
    self.selectable = YES;
    self.scrollEnabled = NO;
    self.contentInset = UIEdgeInsetsZero;
    self.textContainerInset = UIEdgeInsetsZero;
    self.adjustsFontForContentSizeCategory = NO;
    // `RCTTextLayoutManager` already applies the padding it wants.
    self.textContainer.lineFragmentPadding = 0.0;
    // The paragraph owns its layout; the text view must never reflow it.
    self.textContainer.widthTracksTextView = NO;
    self.textContainer.heightTracksTextView = NO;
    // The paragraph publishes its own accessibility elements.
    self.accessibilityElementsHidden = YES;
    self.delegate = self;
  }
  return self;
}

#pragma mark - Menu

- (UIMenu *)editMenuForTextRange:(UITextRange *)textRange suggestedActions:(NSArray<UIMenuElement *> *)suggestedActions
{
  if (_menuItems.count == 0) {
    return [super editMenuForTextRange:textRange suggestedActions:suggestedActions];
  }

  NSInteger location = [self offsetFromPosition:self.beginningOfDocument toPosition:textRange.start];
  NSInteger length = [self offsetFromPosition:textRange.start toPosition:textRange.end];
  NSRange range = NSMakeRange(location, length);

  NSMutableArray<UIMenuElement *> *children = [NSMutableArray new];
  __weak __typeof(self) weakSelf = self;
  for (NSDictionary *item in _menuItems) {
    NSString *actionId = item[@"id"];
    NSString *title = item[@"title"];
    if (![actionId isKindOfClass:NSString.class] || ![title isKindOfClass:NSString.class]) {
      continue;
    }
    [children addObject:[UIAction actionWithTitle:title
                                            image:nil
                                       identifier:nil
                                          handler:^(__kindof UIAction *action) {
                                            [weakSelf _performMenuAction:actionId range:range];
                                          }]];
  }
  [children addObjectsFromArray:suggestedActions];
  return [UIMenu menuWithChildren:children];
}

- (void)_performMenuAction:(NSString *)actionId range:(NSRange)range
{
  if (self.onMenuAction) {
    self.onMenuAction(actionId, range);
  }
  [self resignFirstResponder];
}

#pragma mark - Giving the touch to the selection

/*
 * The selection gesture and `RCTSurfaceTouchHandler` track the same touch.
 * While a selection exists the touch belongs to the selection, so lifting the
 * finger, or dragging a handle that starts on a pressable <Text>, must not press
 * it. Disabling a recognizer cancels what it tracks, which reaches React Native
 * as a cancelled touch.
 */
- (void)textViewDidChangeSelection:(UITextView *)textView
{
  if (!_isProgrammaticChange && textView.selectedRange.length > 0) {
    [self _cancelSurfaceTouches];
  }
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  if (self.selectedRange.length > 0) {
    [self _cancelSurfaceTouches];
  }
  [super touchesBegan:touches withEvent:event];
}

- (void)_cancelSurfaceTouches
{
  for (UIView *ancestor = self.superview; ancestor != nil; ancestor = ancestor.superview) {
    for (UIGestureRecognizer *recognizer in ancestor.gestureRecognizers) {
      if ([recognizer isKindOfClass:[RCTSurfaceTouchHandler class]] && recognizer.isEnabled) {
        recognizer.enabled = NO;
        recognizer.enabled = YES;
      }
    }
  }
}

#pragma mark - Dismissing the selection

- (BOOL)becomeFirstResponder
{
  BOOL didBecomeFirstResponder = [super becomeFirstResponder];
  if (didBecomeFirstResponder) {
    [self _addDismissSelectionRecognizer];
    if (self.onFirstResponderChange) {
      self.onFirstResponderChange(YES);
    }
  }
  return didBecomeFirstResponder;
}

- (BOOL)resignFirstResponder
{
  BOOL didResignFirstResponder = [super resignFirstResponder];
  if (didResignFirstResponder) {
    [self _removeDismissSelectionRecognizer];
    self.selectedRange = NSMakeRange(0, 0);
    if (self.onFirstResponderChange) {
      self.onFirstResponderChange(NO);
    }
  }
  return didResignFirstResponder;
}

- (void)willMoveToWindow:(UIWindow *)newWindow
{
  [super willMoveToWindow:newWindow];
  if (newWindow == nil) {
    [self _removeDismissSelectionRecognizer];
    if (self.onRemovedFromWindow) {
      // Not while UIKit is moving the view hierarchy.
      __weak __typeof(self) weakSelf = self;
      dispatch_async(dispatch_get_main_queue(), ^{
        __typeof(self) strongSelf = weakSelf;
        if (strongSelf != nil && strongSelf.window == nil && strongSelf.onRemovedFromWindow) {
          strongSelf.onRemovedFromWindow();
        }
      });
    }
  }
}

- (void)_addDismissSelectionRecognizer
{
  if (_dismissSelectionRecognizer != nil) {
    return;
  }

  // On the topmost React Native view, not on the window: `RCTSurfaceTouchHandler`
  // gives way to a recognizer outside the surface, so a window recognizer would
  // make every touch in the app wait for this one.
  UIView *rootView = nil;
  for (UIView *ancestor = self.superview; ancestor != nil; ancestor = ancestor.superview) {
    if ([ancestor isKindOfClass:[RCTViewComponentView class]]) {
      rootView = ancestor;
    }
  }
  if (rootView == nil) {
    return;
  }

  _dismissSelectionRecognizer =
      [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTapToDismissSelection:)];
  _dismissSelectionRecognizer.cancelsTouchesInView = NO;
  _dismissSelectionRecognizer.delaysTouchesBegan = NO;
  _dismissSelectionRecognizer.delaysTouchesEnded = NO;
  [rootView addGestureRecognizer:_dismissSelectionRecognizer];
}

- (void)_removeDismissSelectionRecognizer
{
  [_dismissSelectionRecognizer.view removeGestureRecognizer:_dismissSelectionRecognizer];
  _dismissSelectionRecognizer = nil;
}

- (void)_handleTapToDismissSelection:(UITapGestureRecognizer *)recognizer
{
  if ([self pointInside:[recognizer locationInView:self] withEvent:nil]) {
    return;
  }
  [self resignFirstResponder];
}

#pragma mark - Copying

/*
 * Writes the selected range as rich text and as plain text, the same items
 * `RCTParagraphComponentView` writes for the whole paragraph.
 */
- (void)copy:(id)sender
{
  NSRange selectedRange = self.selectedRange;
  NSAttributedString *sourceAttributedText = _sourceAttributedText;

  if (sourceAttributedText == nil || selectedRange.length == 0 ||
      NSMaxRange(selectedRange) > sourceAttributedText.length) {
    [super copy:sender];
    return;
  }

  NSAttributedString *selectedText = [sourceAttributedText attributedSubstringFromRange:selectedRange];
  NSMutableDictionary *item = [NSMutableDictionary new];

  NSData *rtf = [selectedText dataFromRange:NSMakeRange(0, selectedText.length)
                         documentAttributes:@{NSDocumentTypeDocumentAttribute : NSRTFDTextDocumentType}
                                      error:nil];
  if (rtf) {
    [item setObject:rtf forKey:UTTypeFlatRTFD.identifier];
  }
  [item setObject:selectedText.string forKey:UTTypeUTF8PlainText.identifier];

  UIPasteboard.generalPasteboard.items = @[ item ];
}

@end
