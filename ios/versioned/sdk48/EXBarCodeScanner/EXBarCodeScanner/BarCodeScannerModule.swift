import ABI48_0_0ExpoModulesCore

public final class BarCodeScannerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBarCodeScanner")

    Constants([
      "Type": [
        "front": ABI48_0_0EXCameraType.front.rawValue,
        "back": ABI48_0_0EXCameraType.back.rawValue
      ],
      "BarCodeType": ABI48_0_0EXBarCodeScannerUtils.validBarCodeTypes()
    ])

    OnCreate {
      let permissionsManager = self.appContext?.permissions

      ABI48_0_0EXPermissionsMethodsDelegate.register(
        [ABI48_0_0EXBareCodeCameraRequester()],
        withPermissionsManager: permissionsManager
      )
    }

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      ABI48_0_0EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: ABI48_0_0EXBareCodeCameraRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      ABI48_0_0EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: ABI48_0_0EXBareCodeCameraRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("scanFromURLAsync") { (url: URL, _: [String], promise: Promise) in
      guard let imageLoader = appContext?.imageLoader else {
        throw ImageLoaderNotFound()
      }

      imageLoader.loadImage(for: url) { error, image in
        if error != nil {
          promise.reject(FailedToLoadImage())
          return
        }

        guard let cgImage = image?.cgImage else {
          promise.reject(FailedToLoadImage())
          return
        }

        guard let detector = CIDetector(
          ofType: CIDetectorTypeQRCode,
          context: nil,
          options: [CIDetectorAccuracy: CIDetectorAccuracyHigh]
        ) else {
          promise.reject(InitScannerFailed())
          return
        }

        let ciImage = CIImage(cgImage: cgImage)
        let features = detector.features(in: ciImage)
        promise.resolve(self.getResultFrom(features))
      }
    }

    View(ABI48_0_0EXBarCodeScannerView.self) {
      Events("onBarCodeScanned")

      Prop("type") { (view, type: Int) in
        if view.presetCamera != type {
          view.presetCamera = type
        }
      }

      Prop("barCodeTypes") { (view, barcodeTypes: [String]) in
        view.barCodeTypes = barcodeTypes
      }
    }
  }

  private func getResultFrom(_ features: [CIFeature]) -> [[AnyHashable: Any]?] {
    var result = [[AnyHashable: Any]?]()

    for feature in features {
      if let qrCodeFeature = feature as? CIQRCodeFeature {
        let item = ABI48_0_0EXBarCodeScannerUtils.ciQRCodeFeature(
          toDicitionary: qrCodeFeature,
          barCodeType: AVMetadataObject.ObjectType.qr.rawValue
        )
        result.append(item)
      }
    }

    return result
  }
}
