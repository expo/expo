import UIKit

/// Returns the system SF Symbol with the given name, or a custom symbol or image
/// with that name from the app's asset catalog.
func symbolImage(named name: String) -> UIImage? {
  UIImage(systemName: name) ?? UIImage(named: name)
}
