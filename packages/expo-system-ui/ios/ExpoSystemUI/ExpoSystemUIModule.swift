// Copyright 2021-present 650 Industries. (AKA Expo) All rights reserved.

import ExpoModulesCore

public class ExpoSystemUIModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoSystemUI")

    function("getBackgroundColorAsync") { () -> String? in
      var color: String? = nil
      EXUtilities.performSynchronously {
        if let backgroundColor = self.appContext?.utilities?.currentViewController()?.view.backgroundColor?.cgColor {
          color = EXUtilities.hexString(with: backgroundColor)
        }
      }
      return color
    }

    function("setBackgroundColorAsync") { (color: Int) in
      EXUtilities.performSynchronously {
        self.appContext?.utilities?.currentViewController()?.view.backgroundColor = EXUtilities.uiColor(color)
      }
    }
  }
}
