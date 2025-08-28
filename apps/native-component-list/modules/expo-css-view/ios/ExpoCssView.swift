import ExpoModulesCore
import WebKit

class ExpoCssView: ExpoView {
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

  private var backdropView: UIVisualEffectView?
  
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
        if let filter = getBlurFilter(radius: blurRadius) {
          layerFilters.add(filter)
        }
      }
      
      if let grayscaleAmount = filterConfig["grayscale"] as? CGFloat {
        if let filter = getGrayscaleFilter(amount: grayscaleAmount) {
          layerFilters.add(filter)
        }
      }
    }
    
    self.layer.filters = layerFilters as? [Any]
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
      let layerFilters = NSMutableArray()
      
      for filterConfig in filters {
        if let blurRadius = filterConfig["blur"] as? CGFloat {
          if let filter = getBlurFilter(radius: blurRadius) {
            layerFilters.add(filter)
          }
        }
        
        // Handle grayscale filter
        if let grayscaleAmount = filterConfig["grayscale"] as? CGFloat {
          // CSS behaviour is 1 = grayscale. 0 = colorful
          // iOS behaviour is 0 = grayscale. 1 = colorful
          // so we subtract by 1
          if let filter = getGrayscaleFilter(amount: 1 - grayscaleAmount) {
            layerFilters.add(filter)
          }
        }
      }
      
      backdropSubview.layer.filters = layerFilters as? [Any]
    }
  }

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
  
  // MARK: - Filter Creation Functions
  
  private func getBlurFilter(radius: CGFloat) -> NSObject? {
    guard let FilterClass = Self.FilterClass else { return nil }
    
    let selector = NSSelectorFromString("filterWithType:")
    guard FilterClass.responds(to: selector) else { return nil }
    
    let methodIMP = FilterClass.method(for: selector)
    let filterWithType = unsafeBitCast(methodIMP, to: (@convention(c) (AnyClass, Selector, NSString) -> Any).self)
    let gaussianBlurFilter = filterWithType(FilterClass, selector, "gaussianBlur")
    
    if let filter = gaussianBlurFilter as? NSObject {
      filter.setValue(radius, forKey: "inputRadius")
      return filter
    }
    return nil
  }
  
  private func getGrayscaleFilter(amount: CGFloat) -> NSObject? {
    guard let FilterClass = Self.FilterClass else { return nil }
    
    let selector = NSSelectorFromString("filterWithType:")
    guard FilterClass.responds(to: selector) else { return nil }
    
    let methodIMP = FilterClass.method(for: selector)
    let filterWithType = unsafeBitCast(methodIMP, to: (@convention(c) (AnyClass, Selector, NSString) -> Any).self)
    let colorSaturateFilter = filterWithType(FilterClass, selector, "colorSaturate")
    
    if let filter = colorSaturateFilter as? NSObject {
      filter.setValue(amount, forKey: "inputAmount")
      return filter
    }
    return nil
  }
}

