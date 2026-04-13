import UIKit
import React

@objc(EXManagedAppSplashScreenViewProvider)
class ManagedAppSplashscreenViewProvider: NSObject, SplashScreenViewProvider {
  var configuration: ManagedAppSplashScreenConfiguration?
  var splashScreenView: UIView?
  var splashImageView: UIImageView?

  @objc init(with manifest: EXManifests.Manifest) {
    configuration = SplashScreenConfigurationBuilder.parse(manifest: manifest)
  }

  func createSplashScreenView() -> UIView {
    let view = UIView()
    configureSplashScreenView(for: view, previousConfiguration: nil)
    splashScreenView = view
    return view
  }

  @objc func updateSplashScreenView(with manifest: EXManifests.Manifest) {
    let previousConfiguration = self.configuration
    let newConfiguration = SplashScreenConfigurationBuilder.parse(manifest: manifest)
    configuration = newConfiguration

    if let splashScreenView {
      configureSplashScreenView(for: splashScreenView, previousConfiguration: previousConfiguration ?? newConfiguration)
    }
  }

  func configureSplashScreenView(for view: UIView, previousConfiguration: ManagedAppSplashScreenConfiguration?) {
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        return
      }

      view.backgroundColor = EXUtil.color(withHexString: configuration?.backgroundColor) ?? .white
      let imageWidth = configuration?.imageWidth ?? 100

      if let imageUrl = configuration?.imageUrl {
        if splashImageView == nil
            || previousConfiguration?.imageUrl != imageUrl
            || previousConfiguration?.imageWidth != configuration?.imageWidth {
          splashImageView?.removeFromSuperview()

          let imageView = createImageView(with: imageUrl)
          splashImageView = imageView
          view.addSubview(imageView)

          NSLayoutConstraint.activate([
            imageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            imageView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            imageView.widthAnchor.constraint(equalToConstant: CGFloat(imageWidth))
          ])
        }
      }
    }
  }

  private func createImageView(with imageUrl: String) -> UIImageView {
    let imageView = UIImageView()
    imageView.translatesAutoresizingMaskIntoConstraints = false
    imageView.contentMode = .scaleAspectFit

    imageView.sd_setImage(with: URL(string: imageUrl)) { [weak imageView] image, _, _, _ in
      guard let imageView, let image, image.size.width > 0 else {
        return
      }

      imageView.heightAnchor.constraint(
        equalTo: imageView.widthAnchor,
        multiplier: image.size.height / image.size.width
      ).isActive = true
    }

    return imageView
  }
}
