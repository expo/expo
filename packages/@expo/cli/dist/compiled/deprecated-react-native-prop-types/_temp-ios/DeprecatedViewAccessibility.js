'use strict';

var PropTypes = require('prop-types');
var DeprecatedViewAccessibility = {
  AccessibilityRolePropType: PropTypes.oneOf(['adjustable', 'alert', 'button', 'checkbox', 'combobox', 'drawerlayout', 'dropdownlist', 'grid', 'header', 'horizontalscrollview', 'iconmenu', 'image', 'imagebutton', 'keyboardkey', 'link', 'list', 'menu', 'menubar', 'menuitem', 'none', 'pager', 'progressbar', 'radio', 'radiogroup', 'scrollbar', 'scrollview', 'search', 'slidingdrawer', 'spinbutton', 'summary', 'switch', 'tab', 'tabbar', 'tablist', 'text', 'timer', 'togglebutton', 'toolbar', 'viewgroup', 'webview']),
  AccessibilityStatePropType: PropTypes.object,
  AccessibilityActionInfoPropType: PropTypes.object,
  AccessibilityValuePropType: PropTypes.object,
  RolePropType: PropTypes.oneOf(['alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog', 'directory', 'document', 'feed', 'figure', 'form', 'grid', 'group', 'heading', 'img', 'link', 'list', 'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem', 'meter', 'navigation', 'none', 'note', 'option', 'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'summary', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'])
};
module.exports = DeprecatedViewAccessibility;