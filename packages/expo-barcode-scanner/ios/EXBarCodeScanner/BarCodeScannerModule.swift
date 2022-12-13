import ExpoModulesCore

public final class BarCodeScannerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBarCodeScanner")

    Constants {
      return [
        "Type": [
          "front": EXCameraType.front.rawValue,
          "back": EXCameraType.back.rawValue
        ],
        "BarCodeType": EXBarCodeScannerUtils.validBarCodeTypes()
      ]
    }

    OnCreate {
      let permissionsManager = self.appContext?.permissions

      EXPermissionsMethodsDelegate.register(
        [EXBareCodeCameraRequester()],
        withPermissionsManager: permissionsManager
      )
    }

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: EXBareCodeCameraRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: EXBareCodeCameraRequester.self,
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
        var result = [[AnyHashable: Any]?]()

        for feature in features {
          do {
            let qrCodefeature = try feature as! CIQRCodeFeature
            let item = EXBarCodeScannerUtils.ciQRCodeFeature(
              toDicitionary: qrCodefeature,
              barCodeType: AVMetadataObject.ObjectType.qr.rawValue
            )
            result.append(item)
          } catch {
            log.error("Failed to cast feature")
          }
        }

        promise.resolve(result)
      }
    }

    View(EXBarCodeScannerView.self) {
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
}
