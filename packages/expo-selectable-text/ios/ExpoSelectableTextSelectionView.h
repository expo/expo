#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Removes every attribute that paints, so that the text view lays out the same
 * glyphs as the paragraph but draws only the selection.
 */
NSAttributedString *ExpoSelectableTextUnpaintedString(NSAttributedString *attributedString);

/*
 * A non-editable `UITextView` that provides selection for a paragraph that
 * React Native draws. It sits under the drawn text, so UIKit paints the
 * selection highlight and the glyphs stay on top.
 */
@interface ExpoSelectableTextSelectionView : UITextView <UITextViewDelegate>

// The painted text. `copy:` writes from it, because the text view's own storage is unpainted.
@property (nonatomic, copy, nullable) NSAttributedString *sourceAttributedText;

// Items of the shape `{ id: string, title: string }`, shown before the system items.
@property (nonatomic, copy) NSArray<NSDictionary *> *menuItems;

@property (nonatomic, copy, nullable) void (^onMenuAction)(NSString *actionId, NSRange range);

@property (nonatomic, copy, nullable) void (^onFirstResponderChange)(BOOL isFirstResponder);

@end

NS_ASSUME_NONNULL_END
