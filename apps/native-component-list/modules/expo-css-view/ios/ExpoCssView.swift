import ExpoModulesCore
import WebKit

class ExpoCssView: ExpoView {
  private static var FilterClass: AnyClass? = {
    let tempBlurView = UIVisualEffectView(effect: UIBlurEffect(style: .regular))
    for subview in tempBlurView.subviews {
      if NSStringFromClass(type(of: subview)).lowercased().contains("backdrop") {
        if let firstFilter = subview.layer.filters?.first as? NSObject {
          let filterClass = type(of: firstFilter)
          print("Found FilterClass: \(NSStringFromClass(filterClass))")
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
    self.layer.filters = getFiltersForLayer(filters: filters)
  }

  func setBackdropFilter(_ filters: [[String: Any]]?) {
    backdropView?.removeFromSuperview()
    backdropView = nil
    
    guard let filters = filters else { return }
    
    let backdrop = UIVisualEffectView(effect: UIBlurEffect(style: .regular))
    backdrop.frame = self.bounds
    backdrop.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    self.addSubview(backdrop)
    self.backdropView = backdrop
    
    if let backdropSubview = findBackdropSubview(in: backdrop) {
      backdropSubview.layer.filters = getFiltersForLayer(filters: filters)
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
  
  private func getFiltersForLayer(filters: [[String: Any]]?) -> [Any]? {
    guard let filters = filters else { return nil }
    
    let layerFilters = NSMutableArray()
    
    for filterConfig in filters {
      if let blurRadius = filterConfig["blur"] as? CGFloat {
        if let filter = getBlurFilter(radius: blurRadius) {
          layerFilters.add(filter)
        }
      }
      
      if let grayscaleAmount = filterConfig["grayscale"] as? CGFloat {
        // CSS behaviour is 1 = grayscale. 0 = colorful
        // iOS behaviour is 0 = grayscale. 1 = colorful
        // so we adjust it here to match the CSS behaviour
        let adjustedAmount = 1 - grayscaleAmount
        if let filter = getGrayscaleFilter(amount: adjustedAmount) {
          layerFilters.add(filter)
        }
      }
      
      if let brightnessAmount = filterConfig["brightness"] as? CGFloat {
        if let filter = getBrightnessFilter(amount: brightnessAmount) {
          layerFilters.add(filter)
        }
      }
      
      if let saturateAmount = filterConfig["saturate"] as? CGFloat {
        if let filter = getSaturateFilter(amount: saturateAmount) {
          layerFilters.add(filter)
        }
      }
      
      if let contrastAmount = filterConfig["contrast"] as? CGFloat {
        if let filter = getContrastFilter(amount: contrastAmount) {
          layerFilters.add(filter)
        }
      }

      if let invertAmount = filterConfig["invert"] as? CGFloat {
        if let filter = getInvertFilter(amount: invertAmount) {
          layerFilters.add(filter)
        }
      }
    }
    
    return layerFilters as? [Any]
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
  
  private func getBrightnessFilter(amount: CGFloat) -> NSObject? {
    guard let FilterClass = Self.FilterClass else { return nil }
    
    let selector = NSSelectorFromString("filterWithType:")
    guard FilterClass.responds(to: selector) else { return nil }
    
    let methodIMP = FilterClass.method(for: selector)
    let filterWithType = unsafeBitCast(methodIMP, to: (@convention(c) (AnyClass, Selector, NSString) -> Any).self)
    let brightnessFilter = filterWithType(FilterClass, selector, "colorBrighten")
    
    if let filter = brightnessFilter as? NSObject {
      filter.setValue(amount, forKey: "inputAmount")
      return filter
    }
    return nil
  }
  
  private func getContrastFilter(amount: CGFloat) -> NSObject? {
    guard let FilterClass = Self.FilterClass else { return nil }
    
    let selector = NSSelectorFromString("filterWithType:")
    guard FilterClass.responds(to: selector) else { return nil }
    
    let methodIMP = FilterClass.method(for: selector)
    let filterWithType = unsafeBitCast(methodIMP, to: (@convention(c) (AnyClass, Selector, NSString) -> Any).self)
    let contrastFilter = filterWithType(FilterClass, selector, "colorContrast")
    
    if let filter = contrastFilter as? NSObject {
      filter.setValue(amount, forKey: "inputAmount")
      return filter
    }
    return nil
  }
  
  private func getInvertFilter(amount: CGFloat) -> NSObject? {
    guard let FilterClass = Self.FilterClass else { return nil }
    
    let selector = NSSelectorFromString("filterWithType:")
    guard FilterClass.responds(to: selector) else { return nil }
    
    let methodIMP = FilterClass.method(for: selector)
    let filterWithType = unsafeBitCast(methodIMP, to: (@convention(c) (AnyClass, Selector, NSString) -> Any).self)
    let invertFilter = filterWithType(FilterClass, selector, "colorInvert")
    
    if let filter = invertFilter as? NSObject {
      filter.setValue(amount, forKey: "inputAmount")
      return filter
    }
    return nil
  }
  
  private func getSaturateFilter(amount: CGFloat) -> NSObject? {
    guard let FilterClass = Self.FilterClass else { return nil }
    
    let selector = NSSelectorFromString("filterWithType:")
    guard FilterClass.responds(to: selector) else { return nil }
    
    let methodIMP = FilterClass.method(for: selector)
    let filterWithType = unsafeBitCast(methodIMP, to: (@convention(c) (AnyClass, Selector, NSString) -> Any).self)
    let saturateFilter = filterWithType(FilterClass, selector, "colorSaturate")
    
    if let filter = saturateFilter as? NSObject {
      filter.setValue(amount, forKey: "inputAmount")
      return filter
    }
    return nil
  }
  
}

