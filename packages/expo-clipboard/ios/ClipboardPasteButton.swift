import ExpoModulesCore
import UniformTypeIdentifiers

class ClipboardPasteButton: ExpoView {
  let onPastePressed = EventDispatcher()

  // MARK: - Properties
  var baseBackgroundColor: UIColor?
  var baseForegroundColor: UIColor?
  var cornerStyle: CornerStyle = .capsule
  var displayMode: DisplayMode = .iconAndLabel
  var acceptedContentTypes: [AcceptedTypes] = []
  var imageOptions = GetImageOptions()

  private var childView: UIView?

  func update() {
    unmountChild()
    if #available(iOS 16.0, *) {
      mountView()
    } else {
      log.error("ClipboardPasteButton is only supported on iOS 16 and above")
    }
  }

  @available(iOS 16.0, *)
  private func mountView() {
    let configuration = UIPasteControl.Configuration()
    configuration.baseBackgroundColor = baseBackgroundColor
    configuration.baseForegroundColor = baseForegroundColor
    configuration.cornerStyle = cornerStyle.toCornerStyle()
    configuration.displayMode = displayMode.toUIDisplayMode()

    let control = UIPasteControl(configuration: configuration)
    control.translatesAutoresizingMaskIntoConstraints = false
    control.target = self
    setContentTypes()

    self.addSubview(control)
    childView = control

    NSLayoutConstraint.activate([
      control.topAnchor.constraint(equalTo: topAnchor),
      control.bottomAnchor.constraint(equalTo: bottomAnchor),
      control.leadingAnchor.constraint(equalTo: leadingAnchor),
      control.trailingAnchor.constraint(equalTo: trailingAnchor)
    ])
  }

  override func paste(itemProviders: [NSItemProvider]) {
    guard #available(iOS 14.0, *) else {
      return
    }
    for provider in itemProviders {
      if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
        _ = provider.loadObject(ofClass: UIImage.self) { data, error in
          guard error == nil else {
            log.error("Error loading pasted image")
            return
          }
          self.processImage(item: data)
        }
      } else if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
        _ = provider.loadObject(ofClass: URL.self) { data, error in
          guard error == nil else {
            log.error("Error loading pasted content")
            return
          }

          self.onPastePressed([
            "type": "text",
            "text": data?.absoluteString
          ])
        }
      } else if provider.hasItemConformingToTypeIdentifier(UTType.html.identifier) && acceptedContentTypes.contains(.html) {
        _ = provider.loadObject(ofClass: String.self) { data, error in
          guard error == nil else {
            log.error("Error loading pasted content")
            return
          }
          self.processHtml(data: data)
        }
      } else if provider.hasItemConformingToTypeIdentifier(UTType.utf8PlainText.identifier) && !acceptedContentTypes.contains(.html) {
        _ = provider.loadObject(ofClass: String.self) { data, error in
          guard error == nil else {
            log.error("Error loading pasted content")
            return
          }

          guard let data = data as? String else {
            log.error("Failed to read text data")
            return
          }

          self.onPastePressed([
            "type": "text",
            "text": data
          ])
        }
      }
    }
  }

  @available(iOS 14.0, *)
  private func setContentTypes() {
    if acceptedContentTypes.isEmpty {
      pasteConfiguration = UIPasteConfiguration(acceptableTypeIdentifiers: [
        UTType.utf8PlainText.identifier,
        UTType.image.identifier
      ])
    } else {
      pasteConfiguration = UIPasteConfiguration(acceptableTypeIdentifiers: acceptedContentTypes.map {
        $0.typeIdentifier()
      })
    }
  }

  private func processImage(item: NSItemProviderReading?) {
    guard let image = item as? UIImage else {
      log.error("Failed to read image data")
      return
    }

    guard let data = imageToData(image) else {
      log.error("Failed to process image data")
      return
    }

    guard let fileSystem = appContext?.fileSystem else {
      log.error("Failed to access FileSystem")
      return
    }

    let imageData = "data:\(imageOptions.imageFormat.getMimeType());base64,\(data.base64EncodedString())"
    self.onPastePressed([
      "type": "image",
      "data": imageData,
      "size": [
        "width": image.size.width,
        "height": image.size.height
      ]
    ])
  }

  private func processHtml(data: String?) {
    guard let htmlString = data as? String else {
      log.error("Failed to read html data")
      return
    }

    let attributedString = try? NSAttributedString(htmlString: htmlString)

    self.onPastePressed([
      "type": "text",
      "text": attributedString?.htmlString ?? ""
    ])
  }

  private func unmountChild() {
    childView?.removeFromSuperview()
    childView = nil
  }

  private func imageToData(_ image: UIImage) -> Data? {
    switch imageOptions.imageFormat {
    case .jpeg: return image.jpegData(compressionQuality: imageOptions.jpegQuality)
    case .png: return image.pngData()
    }
  }
}
