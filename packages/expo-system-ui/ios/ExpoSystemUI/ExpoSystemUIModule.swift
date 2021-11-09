// Copyright 2021-present 650 Industries. (AKA Expo) All rights reserved.

import ExpoModulesCore

public class ExpoSystemUIModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoSystemUI")

    method("getBackgroundColorAsync") { () -> String? in
      var color: String? = nil
      EXUtilities.performSynchronously {
        // Get the root view controller of the delegate window.
        if let window = UIApplication.shared.delegate?.window, let backgroundColor = window?.rootViewController?.view.backgroundColor?.cgColor {
          color = EXUtilities.hexString(with: backgroundColor)
        }
      }
      return color
    }

    method("setBackgroundColorAsync") { (color: Int) in
      EXUtilities.performSynchronously {
        let color = EXUtilities.uiColor(color)
        // Set the app-wide window, this could have future issues when running multiple React apps,
        // i.e. dev client can't use expo-system-ui.
        // Without setting the window backgroundColor, native-stack modals will show the wrong color.
        if let window = UIApplication.shared.delegate?.window {
          window?.backgroundColor = color
          window?.rootViewController?.view.backgroundColor = color
        }
      }
    }
  }
}
