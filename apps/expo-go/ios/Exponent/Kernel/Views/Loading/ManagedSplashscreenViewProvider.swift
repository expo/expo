import UIKit
import React

@objc(EXManagedAppSplashScreenViewProvider)
class ManagedAppSplashscreenViewProvider: NSObject, SplashScreenViewProvider {
  var configuration: ManagedAppSplashScreenConfiguration?
  var splashScreenView: UIView?
  var imageViewContainer: UIView?

  @objc init(with manifest: EXManifests.Manifest) {
    configuration = SplashScreenConfigurationBuilder.parse(manifest: manifest)
  }

  func createSplashScreenView() -> UIView {
    let view = UIView()
    configureSplashScreenView(previousConfiguration: nil)
    splashScreenView = view
    return view
  }

  @objc func updateSplashScreenView(with manifest: EXManifests.Manifest) {
    let previousConfiguration = self.configuration
    let newConfiguration = SplashScreenConfigurationBuilder.parse(manifest: manifest)

    configuration = newConfiguration

    if splashScreenView != nil {
      configureSplashScreenView(previousConfiguration: previousConfiguration ?? newConfiguration)
    }
  }

  func configureSplashScreenView(previousConfiguration: ManagedAppSplashScreenConfiguration?) {
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        return
      }

      splashScreenView?.backgroundColor = .white

      if imageViewContainer == nil || previousConfiguration?.imageUrl != configuration?.imageUrl {
        imageViewContainer?.removeFromSuperview()

        let appName = createNameLabel()
        let container = createStackView()

        imageViewContainer = container
        splashScreenView?.addSubview(container)

        container.alpha = 0
        container.addArrangedSubview(appName)

        if let splashScreenView {
          NSLayoutConstraint.activate([
            container.centerXAnchor.constraint(equalTo: splashScreenView.centerXAnchor),
            container.centerYAnchor.constraint(equalTo: splashScreenView.centerYAnchor)
          ])
        }

        if let imageUrl = configuration?.imageUrl {
          let imageView = createImageView(with: imageUrl) { [weak container] imageView, success in
            guard let container else { return }

            if !success {
              imageView.removeFromSuperview()
            }

            UIView.animate(withDuration: 0.3) {
              container.alpha = 1
            }
          }

          container.insertArrangedSubview(imageView, at: 0)

          NSLayoutConstraint.activate([
            imageView.widthAnchor.constraint(equalToConstant: 200),
            imageView.heightAnchor.constraint(equalToConstant: 200)
          ])
        } else {
          UIView.animate(withDuration: 0.3) {
            container.alpha = 1
          }
        }
      }
    }
  }

  private func createStackView() -> UIStackView {
    let container = UIStackView()

    container.translatesAutoresizingMaskIntoConstraints = false
    container.spacing = 30
    container.axis = .vertical
    container.alignment = .center
    container.layer.shadowColor = UIColor.black.cgColor
    container.layer.shadowOffset = CGSize.zero
    container.layer.shadowOpacity = 0.2
    container.layer.shadowRadius = 10
    container.layer.masksToBounds = false
    container.clipsToBounds = false

    return container
  }

  private func createImageView(with imageUrl: String, onLoad: @escaping (UIImageView, Bool) -> Void) -> UIImageView {
    let imageView = UIImageView()

    imageView.translatesAutoresizingMaskIntoConstraints = false
    imageView.sd_setImage(with: URL(string: imageUrl)) { image, _, _, _ in onLoad(imageView, image != nil) }
    imageView.contentMode = .scaleAspectFit
    imageView.layer.cornerRadius = 30
    imageView.layer.masksToBounds = true

    return imageView
  }

  private func createNameLabel() -> UILabel {
    let appName = UILabel()

    appName.translatesAutoresizingMaskIntoConstraints = false
    appName.text = configuration?.appName
    appName.font = .systemFont(ofSize: 20, weight: .semibold)

    return appName
  }
}
