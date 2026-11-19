// Copyright 2021-present 650 Industries. (AKA Expo) All rights reserved.

import ExpoModulesCore

@ExpoModule("ExpoSystemUI")
public class ExpoSystemUIModule: Module {
  private static let colorKey = "ExpoSystemUI.backgroundColor"

  public override func didCreate() {
    let color = UserDefaults.standard.integer(forKey: Self.colorKey)
    if color > 0 {
      Self.setBackgroundColorAsync(color: color)
    } else {
      // TODO: Maybe read from the app manifest instead of from Info.plist.
      // Set / reset the initial color on reload and app start.
      let colorFromPlugin = Bundle.main.object(forInfoDictionaryKey: "RCTRootViewBackgroundColor") as? Int
      Self.setBackgroundColorAsync(color: colorFromPlugin)
    }
  }

  @JS
  @MainActor
  func getBackgroundColorAsync() async -> String? {
    Self.getBackgroundColor()
  }

  @JS
  @MainActor
  func setBackgroundColorAsync(color: Int?) async {
    Self.setBackgroundColorAsync(color: color)
  }

  static func getBackgroundColor() -> String? {
    var color: String?
    EXUtilities.performSynchronously {
      // Get the root view controller of the delegate window.
      if let window = UIApplication.shared.delegate?.window,
        let backgroundColor = window?.rootViewController?.view.backgroundColor?.cgColor
      {
        color = EXUtilities.hexString(with: backgroundColor)
      }
    }
    return color
  }

  static func setBackgroundColorAsync(color: Int?) {
    EXUtilities.performSynchronously {
      if color == nil {
        if let window = UIApplication.shared.delegate?.window {
          // Uses required reason API based on the following reason: CA92.1
          UserDefaults.standard.removeObject(forKey: colorKey)
          let interfaceStyle = window?.traitCollection.userInterfaceStyle
          window?.backgroundColor = nil

          switch interfaceStyle {
          case .dark:
            window?.rootViewController?.view.backgroundColor = .black
          case .light:
            window?.rootViewController?.view.backgroundColor = .white
          default:
            window?.rootViewController?.view.backgroundColor = .white
          }
        }
        return
      }
      UserDefaults.standard.set(color, forKey: colorKey)
      let backgroundColor = EXUtilities.uiColor(color)
      // Set the app-wide window, this could have future issues when running multiple React apps,
      // i.e. dev client can't use expo-system-ui.
      // Without setting the window backgroundColor, native-stack modals will show the wrong color.
      if let window = UIApplication.shared.delegate?.window {
        window?.backgroundColor = backgroundColor
        window?.rootViewController?.view.backgroundColor = backgroundColor
      }
    }
  }
}
