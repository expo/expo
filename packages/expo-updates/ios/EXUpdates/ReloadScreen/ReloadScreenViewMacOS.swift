#if os(macOS)
import AppKit

public class ReloadScreenViewMacOS: NSView {
  private var activityIndicator: NSProgressIndicator?
  private var imageView: NSImageView?
  private var currentConfiguration: ReloadScreenConfiguration?

  override init(frame frameRect: NSRect) {
    super.init(frame: frameRect)
    setupView()
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("Not implemented")
  }

  private func setupView() {
    autoresizingMask = [.width, .height]
    layer?.backgroundColor = NSColor.clear.cgColor
    wantsLayer = true
  }

  func updateConfiguration(_ configuration: ReloadScreenConfiguration) {
    currentConfiguration = configuration
    layer?.backgroundColor = if configuration.imageFullScreen {
      NSColor.clear.cgColor
    } else {
      configuration.backgroundColor.cgColor
    }

    subviews.forEach { $0.removeFromSuperview() }

    if let imageSource = configuration.image {
      addImageView(configuration: configuration, imageSource: imageSource)
    }

    if configuration.spinner.enabled {
      addSpinner(configuration: configuration.spinner)
    }
  }

  private func addImageView(configuration: ReloadScreenConfiguration, imageSource: ReloadScreenImageSource) {
    guard let url = imageSource.url else {
      return
    }

    imageView = NSImageView()
    guard let imageView else {
      return
    }

    imageView.imageScaling = configuration.imageResizeMode.contentMode
    imageView.translatesAutoresizingMaskIntoConstraints = false

    addSubview(imageView)

    if configuration.imageFullScreen {
      addViewConstraints(for: imageView)
    } else if let width = imageSource.width, let height = imageSource.height, width > 0 && height > 0 {
      let scale = imageSource.scale ?? 1.0
      let scaledWidth = width * scale
      let scaledHeight = height * scale

      NSLayoutConstraint.activate([
        imageView.centerXAnchor.constraint(equalTo: centerXAnchor),
        imageView.centerYAnchor.constraint(equalTo: centerYAnchor),
        imageView.widthAnchor.constraint(equalToConstant: scaledWidth),
        imageView.heightAnchor.constraint(equalToConstant: scaledHeight)
      ])
    } else {
      addViewConstraints(for: imageView)
    }

    loadImage(source: url, into: imageView)
  }

  private func addViewConstraints(for imageView: NSImageView) {
    NSLayoutConstraint.activate([
      imageView.leadingAnchor.constraint(equalTo: leadingAnchor),
      imageView.trailingAnchor.constraint(equalTo: trailingAnchor),
      imageView.topAnchor.constraint(equalTo: topAnchor),
      imageView.bottomAnchor.constraint(equalTo: bottomAnchor)
    ])
  }

  private func addSpinner(configuration: SpinnerConfiguration) {
    activityIndicator = NSProgressIndicator()
    guard let activityIndicator else {
      return
    }

    activityIndicator.style = .spinning
    activityIndicator.controlSize = switch configuration.size {
    case .large:
      .large
    case .medium:
      .regular
    case .small:
      .small
    }

    activityIndicator.layer?.backgroundColor = configuration.color.cgColor
    activityIndicator.translatesAutoresizingMaskIntoConstraints = false

    addSubview(activityIndicator)

    NSLayoutConstraint.activate([
      activityIndicator.centerXAnchor.constraint(equalTo: centerXAnchor),
      activityIndicator.centerYAnchor.constraint(equalTo: centerYAnchor),
      activityIndicator.widthAnchor.constraint(equalToConstant: configuration.size.spinnerSize),
      activityIndicator.heightAnchor.constraint(equalToConstant: configuration.size.spinnerSize)
    ])

    activityIndicator.startAnimation(nil)
  }

  private func loadImage(source: URL, into imageView: NSImageView) {
    Task {
      await loadImageFromURL(source, into: imageView)
    }
  }

  private func loadImageFromURL(_ url: URL, into imageView: NSImageView) async {
    do {
      let image: NSImage?

      switch url.scheme {
      case "http", "https":
        let (data, _) = try await URLSession.shared.data(from: url)
        image = NSImage(data: data)
      case "file":
        image = NSImage(contentsOfFile: url.path)
      case "data":
        let data = try Data(contentsOf: url)
        image = NSImage(data: data)
      default:
        image = nil
      }

      guard let image else {
        await MainActor.run {
          self.handleImageLoadFailure()
        }
        return
      }

      await MainActor.run {
        imageView.image = image
      }
    } catch {
      await MainActor.run {
        self.handleImageLoadFailure()
      }
    }
  }

  private func handleImageLoadFailure() {
    imageView?.isHidden = true

    if let config = currentConfiguration {
      layer?.backgroundColor = config.backgroundColor.cgColor
      let spinnerConfig = SpinnerConfiguration(
        enabled: true,
        color: config.spinner.color,
        size: config.spinner.size
      )
      addSpinner(configuration: spinnerConfig)
    }
  }
}
#endif
