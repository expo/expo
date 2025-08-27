import ExpoModulesCore
import WebKit

class ExpoCssView: ExpoView {
  
  private static var FilterClass: AnyClass? = {
    let tempBlurView = UIVisualEffectView(effect: UIBlurEffect(style: .regular))
    for subview in tempBlurView.subviews {
      if NSStringFromClass(type(of: subview)).lowercased().contains("backdrop") {
        if let firstFilter = subview.layer.filters?.first as? NSObject {
          return type(of: firstFilter)
        }
      }
    }
    return nil
  }()
  
  func setFilter(_ filters: [[String: Any]]?) {
    self.layer.filters = nil
    guard let filters = filters else { return }
    
    let layerFilters = NSMutableArray()
    
    for filterConfig in filters {
      if let blurRadius = filterConfig["blur"] as? CGFloat {
        
        if let FilterClass = Self.FilterClass {
          let selector = NSSelectorFromString("filterWithType:")
          if FilterClass.responds(to: selector) {
            let methodIMP = FilterClass.method(for: selector)
            let filterWithType = unsafeBitCast(methodIMP, to: (@convention(c) (AnyClass, Selector, NSString) -> Any).self)
            let gaussianBlurFilter = filterWithType(FilterClass, selector, "gaussianBlur")
            if let filter = gaussianBlurFilter as? NSObject {
              filter.setValue(blurRadius, forKey: "inputRadius")
              layerFilters.add(filter)
            }
          }
        }
      }
      
      if let grayscaleAmount = filterConfig["grayscale"] as? CGFloat {
        
        if let FilterClass = Self.FilterClass {
          let selector = NSSelectorFromString("filterWithType:")
          if FilterClass.responds(to: selector) {
            let methodIMP = FilterClass.method(for: selector)
            let filterWithType = unsafeBitCast(methodIMP, to: (@convention(c) (AnyClass, Selector, NSString) -> Any).self)
            let colorSaturateFilter = filterWithType(FilterClass, selector, "colorSaturate")
            if let filter = colorSaturateFilter as? NSObject {
              filter.setValue(grayscaleAmount, forKey: "inputAmount")
              layerFilters.add(filter)
            }
          }
        }
      }
    }
    
    self.layer.filters = layerFilters as? [Any]
  }
}

