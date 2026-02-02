// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class AppleMapsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAppleMaps")

    Property("isMapsAvailable") {
      if #available(iOS 17.0, *) {
        return true
      }
      return false
    }

    View(AppleMapsViewWrapper.self) {
      AsyncFunction("setCameraPosition") { (view: AppleMapsViewWrapper, config: CameraPosition?) in
        view.setCameraPosition(config: config)
      }

      AsyncFunction("openLookAroundAsync") {
        (view: AppleMapsViewWrapper, coordinates: Coordinate) in
        try await view.openLookAround(coordinate: coordinates)
      }

      AsyncFunction("selectMarker") {
        (view: AppleMapsViewWrapper, id: String?, options: SelectOptions?) in
        view.selectMarker(id: id, options: options)
      }

      AsyncFunction("selectAnnotation") {
        (view: AppleMapsViewWrapper, id: String?, options: SelectOptions?) in
        view.selectAnnotation(id: id, options: options)
      }
    }
  }
}
