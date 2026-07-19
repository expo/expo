// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public protocol DevMenuManagerProtocol {
  /**
   Whether the dev menu window is visible on the device screen.
   */
  @objc
  var isVisible: Bool { get }

  /**
   Opens up the dev menu.
   */
  @objc
  @discardableResult
  func openMenu(_ screen: String?) -> Bool

  @objc
  @discardableResult
  func openMenu() -> Bool

  /**
   Sends an event to JS to start collapsing the dev menu bottom sheet.
   */
  @objc
  @discardableResult
  func closeMenu() -> Bool

  /**
   Forces the dev menu to hide. Called by JS once collapsing the bottom sheet finishes.
   */
  @objc
  @discardableResult
  func hideMenu() -> Bool

  /**
   Toggles the visibility of the dev menu.
   */
  @objc
  @discardableResult
  func toggleMenu() -> Bool
}
