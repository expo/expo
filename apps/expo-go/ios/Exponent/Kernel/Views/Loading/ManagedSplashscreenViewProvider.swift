import UIKit
import React

@objc(EXManagedAppSplashScreenViewProvider)
class ManagedAppSplashscreenViewProvider: NSObject, SplashScreenViewProvider {
  var configuration: ManagedAppSplashScreenConfiguration?
  var splashScreenView: UIView?
  var splashImageView: UIImageView?
  var imageViewContainer: UIView?
  
  @objc init(with manifest: EXManifests.Manifest) {
    configuration = ManagedAppSplashScreenConfigurationBuilder.parse(manifest: manifest)
  }
  
  func createSplashScreenView() -> UIView {
    let view = UIView()
    configureSplashScreenView(for: view, previousConfiguration: nil)
    splashScreenView = view
    return view
  }
  
  @objc func updateSplashScreenView(with manifest: EXManifests.Manifest) {
    let previousConfiguration = self.configuration
    let newConfiguration = ManagedAppSplashScreenConfigurationBuilder.parse(manifest: manifest)
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
      
      splashScreenView?.backgroundColor = .white
      if let imageUrl = configuration?.imageUrl {
        let homeAppRecord = EXKernel.sharedInstance().appRegistry.homeAppRecord
        
        if homeAppRecord?.appManager.reactHost != nil {
          if previousConfiguration?.imageUrl != imageUrl ||
              previousConfiguration?.imageResizeMode != configuration?.imageResizeMode {
            imageViewContainer?.removeFromSuperview()
            imageViewContainer = nil
            splashImageView?.removeFromSuperview()
            splashImageView = nil
            
            let appName = UILabel()
            appName.translatesAutoresizingMaskIntoConstraints = false
            appName.text = configuration?.appName
            appName.font = .systemFont(ofSize: 20, weight: .semibold)
            
            let container = createStackView()
            imageViewContainer = container
            splashScreenView?.addSubview(container)
            
            let imageView = createImageView(with: imageUrl)
            splashImageView = imageView
            
            container.addArrangedSubview(imageView)
            container.addArrangedSubview(appName)
            if let splashScreenView {
              NSLayoutConstraint.activate([
                container.centerXAnchor.constraint(equalTo: splashScreenView.centerXAnchor),
                container.centerYAnchor.constraint(equalTo: splashScreenView.centerYAnchor),
                imageView.widthAnchor.constraint(equalToConstant: 200),
                imageView.heightAnchor.constraint(equalToConstant: 200),
              ])
            }
          }
        }
      }
    }
  }
  
  private func createStackView() -> UIStackView {
    let container = UIStackView()
    container.translatesAutoresizingMaskIntoConstraints = false
    
    container.spacing = 20
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
  
  private func createImageView(with imageUrl: String) -> UIImageView {
    let imageView = UIImageView()
    imageView.translatesAutoresizingMaskIntoConstraints = false
    imageView.sd_setImage(with: URL(string: imageUrl))
    imageView.contentMode = configuration?.imageResizeMode == .cover ? .scaleAspectFill : .scaleAspectFit
    imageView.layer.cornerRadius = 30
    imageView.layer.masksToBounds = true
    
    return imageView
  }
}
