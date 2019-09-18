// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKViewHierarchy.h"

#import <objc/runtime.h>

#import <QuartzCore/QuartzCore.h>

#import <FBSDKCoreKit/FBSDKCoreKit+Internal.h>

#import "FBSDKCodelessMacros.h"
#import "FBSDKCodelessPathComponent.h"

#define MAX_VIEW_HIERARCHY_LEVEL 35

typedef NS_ENUM(NSUInteger, FBCodelessClassBitmask) {
  /** Indicates that the class is subclass of UIControl */
  FBCodelessClassBitmaskUIControl     = 1 << 3,
  /** Indicates that the class is subclass of UIControl */
  FBCodelessClassBitmaskUIButton      = 1 << 4,
  /** Indicates that the class is ReactNative Button */
  FBCodelessClassBitmaskReactNativeButton = 1 << 6,
  /** Indicates that the class is UITableViewCell */
  FBCodelessClassBitmaskUITableViewCell = 1 << 7,
  /** Indicates that the class is UICollectionViewCell */
  FBCodelessClassBitmaskUICollectionViewCell = 1 << 8,
  /** Indicates that the class is UILabel */
  FBCodelessClassBitmaskLabel = 1 << 10,
  /** Indicates that the class is UITextView or UITextField*/
  FBCodelessClassBitmaskInput = 1 << 11,
  /** Indicates that the class is UIPicker*/
  FBCodelessClassBitmaskPicker = 1 << 12,
  /** Indicates that the class is UISwitch*/
  FBCodelessClassBitmaskSwitch = 1 << 13,
  /** Indicates that the class is UIViewController*/
  FBCodelessClassBitmaskUIViewController = 1 << 17,
};

@implementation FBSDKViewHierarchy

+ (NSArray*)getChildren:(NSObject*)obj
{
  if ([obj isKindOfClass:[UIControl class]]) {
    return nil;
  }

  NSMutableArray *children = [NSMutableArray array];

  // children of window should be viewcontroller
  if ([obj isKindOfClass:[UIWindow class]]) {
    UIViewController *rootVC = ((UIWindow *)obj).rootViewController;
    NSArray<UIView *> *subviews = ((UIWindow *)obj).subviews;
    for (UIView *child in subviews) {
      if (child != rootVC.view) {
        UIViewController *vc = [FBSDKViewHierarchy getParentViewController:child];
        if (vc != nil && vc.view == child) {
          [children addObject:vc];
        } else {
          [children addObject:child];
        }
      } else {
        if (rootVC) {
          [children addObject:rootVC];
        }
      }
    }
  } else if ([obj isKindOfClass:[UIView class]]) {
    NSArray<UIView *> *subviews = [((UIView *)obj).subviews copy];
    for (UIView *child in subviews) {
      UIViewController *vc = [FBSDKViewHierarchy getParentViewController:child];
      if (vc && vc.view == child) {
        [children addObject:vc];
      } else {
        [children addObject:child];
      }
    }
  } else if ([obj isKindOfClass:[UINavigationController class]]) {
    UIViewController *vc = ((UINavigationController*)obj).visibleViewController;
    UIViewController *tc = ((UINavigationController*)obj).topViewController;
    NSArray *nextChildren = [FBSDKViewHierarchy getChildren:((UIViewController*)obj).view];
    for (NSObject *child in nextChildren) {
      if (tc && [self isView:child superViewOfView:tc.view]) {
        [children addObject:tc];
      } else if (vc && [self isView:child superViewOfView:vc.view]) {
        [children addObject:vc];
      } else {
        if (child != vc.view && child != tc.view) {
          [children addObject:child];
        } else {
          if (vc && child == vc.view) {
            [children addObject:vc];
          } else if (tc && child == tc.view) {
            [children addObject:tc];
          }
        }
      }
    }

    if (vc && ![children containsObject:vc]) {
      [children addObject:vc];
    }
  } else if ([obj isKindOfClass:[UITabBarController class]]) {
    UIViewController *vc = ((UITabBarController *)obj).selectedViewController;
    NSArray *nextChildren = [FBSDKViewHierarchy getChildren:((UIViewController*)obj).view];
    for (NSObject *child in nextChildren) {
      if (vc && [self isView:child superViewOfView:vc.view]) {
        [children addObject:vc];
      } else {
        if (vc && child == vc.view) {
          [children addObject:vc];
        } else {
          [children addObject:child];
        }
      }
    }

    if (vc && ![children containsObject:vc]) {
      [children addObject:vc];
    }
  } else if ([obj isKindOfClass:[UIViewController class]]) {
    UIViewController *vc = (UIViewController *)obj;
    if (vc.isViewLoaded) {
      NSArray *nextChildren = [FBSDKViewHierarchy getChildren:vc.view];
      if (nextChildren.count > 0) {
        [children addObjectsFromArray:nextChildren];
      }
    }
    for (NSObject *child in vc.childViewControllers) {
      [children addObject:child];
    }
    UIViewController *presentedVC = vc.presentedViewController;
    if (presentedVC) {
      [children addObject:presentedVC];
    }
  }
  return children;
}

+ (NSObject *)getParent:(NSObject *)obj
{
  if ([obj isKindOfClass:[UIView class]]) {
    UIView *superview = ((UIView *)obj).superview;
    UIViewController *superviewViewController = [FBSDKViewHierarchy
                                                 getParentViewController:superview];
    if (superviewViewController && superviewViewController.view == superview) {
      return superviewViewController;
    }
    if (superview && superview != obj) {
      return superview;
    }
  }
  else if ([obj isKindOfClass:[UIViewController class]]) {
    UIViewController *vc = (UIViewController *)obj;
    UIViewController *parentVC = vc.parentViewController;
    UIViewController *presentingVC = vc.presentingViewController;
    UINavigationController *nav = vc.navigationController;
    UITabBarController *tab = vc.tabBarController;

    if (nav) {
      return nav;
    }

    if (tab) {
      return tab;
    }

    if (parentVC) {
      return parentVC;
    }

    if (presentingVC && presentingVC.presentedViewController == vc) {
      return presentingVC;
    }

    // Return parent of view of UIViewController
    NSObject *viewParent = [FBSDKViewHierarchy getParent:vc.view];
    if (viewParent) {
      return viewParent;
    }
  }
  return nil;
}

+ (NSArray *)getPath:(NSObject *)obj
{
  return [FBSDKViewHierarchy getPath:obj limit:MAX_VIEW_HIERARCHY_LEVEL];
}

+ (NSArray *)getPath:(NSObject *)obj limit:(int)limit
{
  if (!obj || limit <= 0) {
    return nil;
  }

  NSMutableArray *path;

  NSObject *parent = [FBSDKViewHierarchy getParent:obj];
  if (parent) {
    NSArray *parentPath = [FBSDKViewHierarchy getPath:parent limit:limit - 1];
    path = [NSMutableArray arrayWithArray:parentPath];
  } else {
    path = [NSMutableArray array];
  }

  NSDictionary *componentInfo = [FBSDKViewHierarchy getAttributesOf:obj parent:parent];

  FBSDKCodelessPathComponent *pathComponent = [[FBSDKCodelessPathComponent alloc]
                                        initWithJSON:componentInfo];
  [path addObject:pathComponent];

  return [NSArray arrayWithArray:path];
}

+ (NSDictionary<NSString *, id> *)getAttributesOf:(NSObject *)obj parent:(NSObject *)parent
{
  NSMutableDictionary *componentInfo = [NSMutableDictionary dictionary];
  componentInfo[CODELESS_MAPPING_CLASS_NAME_KEY] = NSStringFromClass([obj class]);

  if (![FBSDKViewHierarchy isUserInputView:obj]) {
    NSString *text = [FBSDKViewHierarchy getText:obj];
    if (text) {
      componentInfo[CODELESS_MAPPING_TEXT_KEY] = text;
    }
  } else {
    componentInfo[CODELESS_MAPPING_TEXT_KEY] = @"";
    componentInfo[CODELESS_MAPPING_IS_USER_INPUT_KEY] = @YES;
  }

  NSString *hint = [FBSDKViewHierarchy getHint:obj];
  if (hint) {
    componentInfo[CODELESS_MAPPING_HINT_KEY] = hint;
  }

  NSIndexPath *indexPath = [FBSDKViewHierarchy getIndexPath:obj];
  if (indexPath) {
    componentInfo[CODELESS_MAPPING_SECTION_KEY] = @(indexPath.section);
    componentInfo[CODELESS_MAPPING_ROW_KEY] = @(indexPath.row);
  }

  if (parent != nil) {
    NSArray *children = [FBSDKViewHierarchy getChildren:parent];
    NSUInteger index = [children indexOfObject:obj];
    if (index != NSNotFound) {
      componentInfo[CODELESS_MAPPING_INDEX_KEY] = @(index);
    }
  } else {
    componentInfo[CODELESS_MAPPING_INDEX_KEY] = @0;
  }

  componentInfo[CODELESS_VIEW_TREE_TAG_KEY] = @([FBSDKViewHierarchy getTag:obj]);

  return [componentInfo copy];
}

+ (NSMutableDictionary<NSString *, id> *)getDetailAttributesOf:(NSObject *)obj
{
  if (!obj) {
    return nil;
  }

  NSObject *parent = [FBSDKViewHierarchy getParent:obj];

  NSDictionary *simpleAttributes = [FBSDKViewHierarchy getAttributesOf:obj parent:parent];

  NSMutableDictionary *result = [NSMutableDictionary dictionaryWithDictionary:simpleAttributes];

  NSString *className = NSStringFromClass([obj class]);
  result[CODELESS_VIEW_TREE_CLASS_NAME_KEY] = className;

  NSUInteger classBitmask = [FBSDKViewHierarchy getClassBitmask:obj];
  result[CODELESS_VIEW_TREE_CLASS_TYPE_BIT_MASK_KEY] = [NSString stringWithFormat:@"%lu", (unsigned long)classBitmask];

  if ([obj isKindOfClass:[UIControl class]]) {
    // Get actions of UIControl
    UIControl *control = (UIControl *)obj;
    NSMutableSet *actions = [NSMutableSet set];
    NSSet *targets = control.allTargets;
    for (NSObject *target in targets) {
      NSArray *ary = [control actionsForTarget:target forControlEvent:0];
      if (ary.count > 0) {
        [actions addObjectsFromArray:ary];
      }
    }
    if (targets.count > 0) {
      result[CODELESS_VIEW_TREE_ACTIONS_KEY] = actions.allObjects;
    }
  }

  result[CODELESS_VIEW_TREE_DIMENSION_KEY] = [FBSDKViewHierarchy getDimensionOf:obj];

  NSDictionary<NSString *, id> *textStyle = [FBSDKViewHierarchy getTextStyle:obj];
  if (textStyle) {
    result[CODELESS_VIEW_TREE_TEXT_STYLE_KEY] = textStyle;
  }

  // hash text and hint
  result[CODELESS_VIEW_TREE_TEXT_KEY] = [FBSDKUtility SHA256Hash:result[CODELESS_VIEW_TREE_TEXT_KEY]];
  result[CODELESS_VIEW_TREE_HINT_KEY] = [FBSDKUtility SHA256Hash:result[CODELESS_VIEW_TREE_HINT_KEY]];

  return result;
}

+ (NSIndexPath *)getIndexPath:(NSObject *)obj
{
  NSIndexPath *indexPath = nil;

  if ([obj isKindOfClass:[UITableViewCell class]]) {
    UITableView *tableView = [FBSDKViewHierarchy getParentTableView:(UIView *)obj];
    indexPath = [tableView indexPathForCell:(UITableViewCell *)obj];
  } else if ([obj isKindOfClass:[UICollectionViewCell class]]) {
    UICollectionView *collectionView = [FBSDKViewHierarchy getParentCollectionView:(UIView *)obj];
    indexPath = [collectionView indexPathForCell:(UICollectionViewCell *)obj];
  }

  return indexPath;
}

+ (NSString *)getText:(NSObject *)obj
{
  NSString *text = nil;

  if ([obj isKindOfClass:[UIButton class]]) {
    text = ((UIButton *)obj).currentTitle;
  } else if ([obj isKindOfClass:[UITextView class]] ||
             [obj isKindOfClass:[UITextField class]] ||
             [obj isKindOfClass:[UILabel class]]) {
    text = ((UILabel *)obj).text;
  } else if ([obj isKindOfClass:[UIPickerView class]]) {
    UIPickerView *picker = (UIPickerView *)obj;
    NSInteger sections = picker.numberOfComponents;
    NSMutableArray *titles = [NSMutableArray array];

    for (NSInteger i = 0; i < sections; i++) {
      NSInteger row = [picker selectedRowInComponent:i];
      NSString *title;
      if ([picker.delegate
           respondsToSelector:@selector(pickerView:titleForRow:forComponent:)]) {
        title = [picker.delegate pickerView:picker titleForRow:row forComponent:i];
      } else if ([picker.delegate
                  respondsToSelector:@selector(pickerView:attributedTitleForRow:forComponent:)]) {
        title = [picker.delegate
                 pickerView:picker
                 attributedTitleForRow:row forComponent:i].string;
      }
      [titles addObject:title ?: @""];
    }

    if (titles.count > 0) {
      text = [FBSDKBasicUtility JSONStringForObject:titles
                                              error:NULL
                               invalidObjectHandler:NULL];
    }
  } else if ([obj isKindOfClass:[UIDatePicker class]]) {
    UIDatePicker *picker = (UIDatePicker *)obj;
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    formatter.dateFormat = @"yyyy-MM-dd HH:mm:ssZ";
    text = [formatter stringFromDate:picker.date];
  } else if ([obj isKindOfClass:objc_lookUpClass("RCTTextView")]) {
    NSTextStorage *textStorage = [FBSDKAppEventsUtility getVariable:@"_textStorage"
                                                       fromInstance:obj];
    if (textStorage) {
      text = textStorage.string;
    }
  } else if ([obj isKindOfClass:objc_lookUpClass("RCTBaseTextInputView")]) {
    NSAttributedString *attributedText = [FBSDKAppEventsUtility getVariable:@"attributedText"
                                                               fromInstance:obj];
    text = attributedText.string;
  }

  return text.length > 0 ? text : nil;
}

+ (NSDictionary<NSString *, id> *)getTextStyle:(NSObject *)obj
{
  UIFont *font = nil;
  if ([obj isKindOfClass:[UIButton class]]) {
    font = ((UIButton *)obj).titleLabel.font;
  } else if ([obj isKindOfClass:[UILabel class]]) {
    font = ((UILabel *)obj).font;
  } else if ([obj isKindOfClass:[UITextField class]]) {
    font = ((UITextField *)obj).font;
  } else if ([obj isKindOfClass:[UITextView class]]) {
    font = ((UITextView *)obj).font;
  }

  if (font) {
    UIFontDescriptorSymbolicTraits traits = font.fontDescriptor.symbolicTraits;
    BOOL isBold = (traits & UIFontDescriptorTraitBold) != 0;
    BOOL isItalic = (traits & UIFontDescriptorTraitItalic) != 0;
    CGFloat fontSize = font.pointSize;

    return @{
             CODELESS_VIEW_TREE_TEXT_IS_BOLD_KEY: @(isBold),
             CODELESS_VIEW_TREE_TEXT_IS_ITALIC_KEY: @(isItalic),
             CODELESS_VIEW_TREE_TEXT_SIZE_KEY: @(fontSize)
             };
  }

  return nil;
}

+ (NSString *)getHint:(NSObject *)obj
{
  NSString *hint = nil;

  if ([obj isKindOfClass:[UITextField class]]) {
    hint = ((UITextField *)obj).placeholder;
  } else if ([obj isKindOfClass:[UINavigationController class]]) {
    UIViewController *top = ((UINavigationController *)obj).topViewController;
    if (top) {
      hint = NSStringFromClass([top class]);
    }
  }

  return hint.length > 0 ? hint : nil;
}

+ (NSUInteger)getClassBitmask:(NSObject *)obj
{
  NSUInteger bitmask = 0;

  if ([obj isKindOfClass:[UIView class]]) {
    if ([obj isKindOfClass:[UIControl class]]) {
      bitmask |= FBCodelessClassBitmaskUIControl;
      if ([obj isKindOfClass:[UIButton class]]) {
        bitmask |= FBCodelessClassBitmaskUIButton;
      } else if ([obj isKindOfClass:[UISwitch class]]) {
        bitmask |= FBCodelessClassBitmaskSwitch;
      }else if ([obj isKindOfClass:[UIDatePicker class]]) {
        bitmask |= FBCodelessClassBitmaskPicker;
      }
    } else if ([obj isKindOfClass:[UITableViewCell class]]) {
      bitmask |= FBCodelessClassBitmaskUITableViewCell;
    } else if ([obj isKindOfClass:[UICollectionViewCell class]]) {
      bitmask |= FBCodelessClassBitmaskUICollectionViewCell;
    } else if ([obj isKindOfClass:[UIPickerView class]]) {
      bitmask |= FBCodelessClassBitmaskPicker;
    } else if ([obj isKindOfClass:[UILabel class]]) {
      bitmask |= FBCodelessClassBitmaskLabel;
    }

    if ([FBSDKViewHierarchy isRCTButton:((UIView *)obj)]) {
      bitmask |= FBCodelessClassBitmaskReactNativeButton;
    }

    // Check selector of UITextInput protocol instead of checking conformsToProtocol
    if ([obj respondsToSelector:@selector(textInRange:)]) {
      bitmask |= FBCodelessClassBitmaskInput;
    }
  } else if ([obj isKindOfClass:[UIViewController class]]) {
    bitmask |= FBCodelessClassBitmaskUIViewController;
  }

  return bitmask;
}

+ (BOOL)isUserInputView:(NSObject *)obj
{
  if (obj && [obj conformsToProtocol:@protocol(UITextInput)]) {
    id<UITextInput> input = (id<UITextInput>)obj;
    if ([input respondsToSelector:@selector(isSecureTextEntry)]
        && input.secureTextEntry) {
      return YES;
    } else {
      if ([input respondsToSelector:@selector(keyboardType)]) {
        switch (input.keyboardType) {
          case UIKeyboardTypePhonePad:
          case UIKeyboardTypeEmailAddress:
            return YES;
          default: break;
        }
      }
    }
  }

  NSString *text = [FBSDKViewHierarchy getText:obj];
  return text && [FBSDKAppEventsUtility isSensitiveUserData:text];
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
+ (BOOL)isRCTButton:(UIView *)view
{
  if (view == nil) {
    return NO;
  }

  Class classRCTView = objc_lookUpClass(ReactNativeClassRCTView);
  if (classRCTView && [view isKindOfClass:classRCTView] &&
      [view respondsToSelector:@selector(reactTagAtPoint:)] &&
      [view respondsToSelector:@selector(reactTag)] &&
      view.userInteractionEnabled) {
    // We check all its subviews locations and the view is clickable if there exists one that mathces reactTagAtPoint
    for (UIView *subview in view.subviews) {
      if (subview && ![subview isKindOfClass:classRCTView]) {
        NSNumber *reactTag = [view performSelector:@selector(reactTagAtPoint:)
                                        withObject:[NSValue valueWithCGPoint:subview.frame.origin]];
        NSNumber *subviewReactTag = [FBSDKViewHierarchy getViewReactTag:subview];
        if (reactTag != nil && subviewReactTag != nil && [reactTag isEqualToNumber:subviewReactTag]) {
          return YES;
        }
      }
    }
  }

  return NO;
}

+ (NSNumber *)getViewReactTag:(UIView *)view
{
  if (view != nil && [view respondsToSelector:@selector(reactTag)]) {
    NSNumber *reactTag = [view performSelector:@selector(reactTag)];
    if (reactTag != nil && [reactTag isKindOfClass:[NSNumber class]]) {
      return reactTag;
    }
  }

  return nil;
}
#pragma clang diagnostic pop

+ (BOOL)isView:(NSObject *)obj1 superViewOfView:(UIView *)obj2
{
  if (![obj1 isKindOfClass:[UIView class]]
      || ![obj2 isKindOfClass:[UIView class]]) {
    return NO;
  }
  UIView *view1 = (UIView *)obj1;
  UIView *view2 = (UIView *)obj2;
  UIView *superview = view2;
  while (superview) {
    superview = superview.superview;
    if (superview == view1) {
      return YES;
    }
  }

  return NO;
}

+ (UIViewController *)getParentViewController:(UIView *)view
{
  UIResponder *parentResponder = view;

  while (parentResponder) {
    parentResponder = parentResponder.nextResponder;
    if ([parentResponder isKindOfClass:[UIViewController class]]) {
      return (UIViewController *)parentResponder;
    }
  }

  return nil;
}

+ (UITableView *)getParentTableView:(UIView *)cell
{
  UIView *superview = cell.superview;
  while (superview) {
    if ([superview isKindOfClass:[UITableView class]]) {
      return (UITableView *)superview;
    }
    superview = superview.superview;
  }
  return nil;
}

+ (UICollectionView *)getParentCollectionView:(UIView *)cell
{
  UIView *superview = cell.superview;
  while (superview) {
    if ([superview isKindOfClass:[UICollectionView class]]) {
      return (UICollectionView *)superview;
    }
    superview = superview.superview;
  }
  return nil;
}

+ (NSInteger)getTag:(NSObject *)obj
{
  if ([obj isKindOfClass:[UIView class]]) {
    return ((UIView *)obj).tag;
  } else if ([obj isKindOfClass:[UIViewController class]]) {
    return ((UIViewController *)obj).view.tag;
  }

  return 0;
}

+ (NSDictionary<NSString *, NSNumber *> *)getDimensionOf:(NSObject *)obj
{
  UIView *view = nil;

  if ([obj isKindOfClass:[UIView class]]) {
    view = (UIView *)obj;
  } else if ([obj isKindOfClass:[UIViewController class]]) {
    view = ((UIViewController *)obj).view;
  }

  CGRect frame = view.frame;
  CGPoint offset = CGPointZero;

  if ([view isKindOfClass:[UIScrollView class]])
    offset = ((UIScrollView *)view).contentOffset;

  return @{
           CODELESS_VIEW_TREE_TOP_KEY: @((int)frame.origin.y),
           CODELESS_VIEW_TREE_LEFT_KEY: @((int)frame.origin.x),
           CODELESS_VIEW_TREE_WIDTH_KEY: @((int)frame.size.width),
           CODELESS_VIEW_TREE_HEIGHT_KEY: @((int)frame.size.height),
           CODELESS_VIEW_TREE_OFFSET_X_KEY: @((int)offset.x),
           CODELESS_VIEW_TREE_OFFSET_Y_KEY: @((int)offset.y),
           CODELESS_VIEW_TREE_VISIBILITY_KEY: view.isHidden ? @4 : @0
           };
}

@end
