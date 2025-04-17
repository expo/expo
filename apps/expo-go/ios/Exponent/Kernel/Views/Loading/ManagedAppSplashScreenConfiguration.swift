import UIKit

enum SplashScreenImageResizeMode {
  case contain
  case cover
}

struct ManagedAppSplashScreenConfiguration {
  let appName: String?
  let imageUrl: String?
  let imageResizeMode: SplashScreenImageResizeMode?
}
