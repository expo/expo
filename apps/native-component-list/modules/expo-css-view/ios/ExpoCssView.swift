import ExpoModulesCore
import WebKit

class ExpoCssView: ExpoView {
  private var backdropView: UIVisualEffectView?
  
  private static var FilterClass: AnyClass? = {
    let tempBlurView = UIVisualEffectView(effect: UIBlurEffect(style: .regular))
    for subview in tempBlurView.subviews {
      if NSStringFromClass(type(of: subview)).lowercased().contains("backdrop") {
        if let firstFilter = subview.layer.filters?.first as? NSObject {
          let filterClass = type(of: firstFilter)
          return filterClass
        }
      }
    }
    return nil
  }()
  
  private func findBackdropSubview(in view: UIView) -> UIView? {
    for subview in view.subviews {
      let className = NSStringFromClass(type(of: subview)).lowercased()
      if className.contains("backdrop") {
        return subview
      }
      if let found = findBackdropSubview(in: subview) {
        return found
      }
    }
    return nil
  }
  
  func setBackdropFilter(_ filters: [[String: Any]]?) {
    backdropView?.removeFromSuperview()
    backdropView = nil
    
    guard let filters = filters else { return }
    
    let backdrop = UIVisualEffectView(effect: UIBlurEffect(style: .regular))
    backdrop.frame = self.bounds
    backdrop.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    self.insertSubview(backdrop, at: 0)
    self.backdropView = backdrop
    
    if let backdropSubview = findBackdropSubview(in: backdrop) {
      if let FilterClass = Self.FilterClass {
        let selector = NSSelectorFromString("filterWithType:")
        if FilterClass.responds(to: selector) {
          let methodIMP = FilterClass.method(for: selector)
          let filterWithType = unsafeBitCast(methodIMP, to: (@convention(c) (AnyClass, Selector, NSString) -> Any).self)
          
          let layerFilters = NSMutableArray()
          
          for filterConfig in filters {
            // blur
            if let blurRadius = filterConfig["blur"] as? CGFloat {
              let gaussianBlurFilter = filterWithType(FilterClass, selector, "gaussianBlur")
              if let filter = gaussianBlurFilter as? NSObject {
                filter.setValue(blurRadius, forKey: "inputRadius")
                layerFilters.add(filter)
              }
            }
            
            // grayscale
            if let grayscaleAmount = filterConfig["grayscale"] as? CGFloat {
              let colorSaturateFilter = filterWithType(FilterClass, selector, "colorSaturate")
              if let filter = colorSaturateFilter as? NSObject {
                filter.setValue(grayscaleAmount, forKey: "inputAmount")
                layerFilters.add(filter)
              }
            }
          }
          
          backdropSubview.layer.filters = layerFilters as? [Any]
        }
      }
    }
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    backdropView?.frame = self.bounds
  }
  
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

