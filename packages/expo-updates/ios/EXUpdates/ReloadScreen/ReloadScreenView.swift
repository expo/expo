// Copyright 2018-present 650 Industries. All rights reserved.

#if os(iOS) || os(tvOS)
import UIKit

public class ReloadScreenView: UIView {
  private var activityIndicator: UIActivityIndicatorView?
  private var imageView: UIImageView?
  private var currentConfiguration: ReloadScreenConfiguration?

  override init(frame: CGRect) {
    super.init(frame: frame)
    setupView()
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("Not implemented")
  }

  private func setupView() {
    autoresizingMask = [.flexibleWidth, .flexibleHeight]
    backgroundColor = UIColor.clear
  }

  func updateConfiguration(_ configuration: ReloadScreenConfiguration) {
    currentConfiguration = configuration
    backgroundColor = if configuration.imageFullScreen {
      UIColor.clear
    } else {
      configuration.backgroundColor
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

    imageView = UIImageView()
    guard let imageView else {
      return
    }

    imageView.contentMode = configuration.imageResizeMode.contentMode
    imageView.clipsToBounds = true
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
        imageView.widthAnchor.constraint(equalToConstant: scaledWidth < frame.width ? scaledWidth : frame.width),
        imageView.heightAnchor.constraint(equalToConstant: scaledHeight < frame.height ? scaledHeight : frame.height)
      ])
    } else {
      NSLayoutConstraint.activate([
        imageView.centerXAnchor.constraint(equalTo: centerXAnchor),
        imageView.centerYAnchor.constraint(equalTo: centerYAnchor),
        imageView.widthAnchor.constraint(equalTo: widthAnchor),
        imageView.heightAnchor.constraint(equalTo: heightAnchor)
      ])
    }

    loadImage(source: url, into: imageView)
  }

  private func addViewConstraints(for imageView: UIImageView) {
    NSLayoutConstraint.activate([
      imageView.leadingAnchor.constraint(equalTo: leadingAnchor),
      imageView.trailingAnchor.constraint(equalTo: trailingAnchor),
      imageView.topAnchor.constraint(equalTo: topAnchor),
      imageView.bottomAnchor.constraint(equalTo: bottomAnchor)
    ])
  }

  private func addSpinner(configuration: SpinnerConfiguration) {
    activityIndicator = UIActivityIndicatorView()
    guard let activityIndicator else {
      return
    }
    activityIndicator.style = switch configuration.size {
    case .large:
      .large
    case .medium:
      .medium
    case .small:
      .medium
    }

    activityIndicator.color = configuration.color
    activityIndicator.translatesAutoresizingMaskIntoConstraints = false

    addSubview(activityIndicator)

    NSLayoutConstraint.activate([
      activityIndicator.centerXAnchor.constraint(equalTo: centerXAnchor),
      activityIndicator.centerYAnchor.constraint(equalTo: centerYAnchor),
      activityIndicator.widthAnchor.constraint(equalToConstant: configuration.size.spinnerSize),
      activityIndicator.heightAnchor.constraint(equalToConstant: configuration.size.spinnerSize)
    ])

    activityIndicator.startAnimating()
  }

  private func loadImage(source: URL, into imageView: UIImageView) {
    Task {
      await loadImageFromURL(source, into: imageView)
    }
  }

  private func loadImageFromURL(_ url: URL, into imageView: UIImageView) async {
    do {
      let image: UIImage?

      switch url.scheme {
      case "http", "https":
        let (data, _) = try await URLSession.shared.data(from: url)
        image = UIImage(data: data)
      case "file":
        image = UIImage(contentsOfFile: url.path)
      case "data":
        let data = try Data(contentsOf: url)
        image = UIImage(data: data)
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
      backgroundColor = config.backgroundColor
      let spinnerConfig = SpinnerConfiguration(
        enabled: true,
        color: config.spinner.color,
        size: config.spinner.size
      )
      addSpinner(configuration: spinnerConfig)
    }
  }
}
#else
typealias ReloadScreenView = ReloadScreenViewMacOS
#endif
