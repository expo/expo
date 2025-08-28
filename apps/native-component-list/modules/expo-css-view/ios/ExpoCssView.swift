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
  
  private static var hasDiscoveredFilters = false
  
  private static func ensureFiltersDiscovered() {
    guard !hasDiscoveredFilters, let filterClass = FilterClass else { return }
    hasDiscoveredFilters = true
    discoverAvailableFilters(filterClass: filterClass)
  }
  
  private static func discoverAvailableFilters(filterClass: AnyClass) {
    print("=== Discovering Available CAFilter Types ===")
    
    let selector = NSSelectorFromString("filterWithType:")
    guard filterClass.responds(to: selector) else {
      print("FilterClass doesn't respond to filterWithType:")
      return
    }
    
    let methodIMP = filterClass.method(for: selector)
    let filterWithType = unsafeBitCast(methodIMP, to: (@convention(c) (AnyClass, Selector, NSString) -> Any).self)
    
    // Known filter types from Apple documentation and common usage
    let knownFilterTypes = [
      "gaussianBlur",
      "colorSaturate", 
      "colorControls",
      "colorInvert",
      "colorMonochrome",
      "colorMatrix",
      "colorPosterize",
      "colorBrighten",
      "colorContrast",
      "colorHueAdjust",
      "vibrance",
      "exposure",
      "highlights",
      "shadows",
      "colorLookup",
      "variableBlur",
      "motionBlur",
      "zoomBlur",
      "convolution",
      "morphology",
      "luminanceToAlpha"
    ]
    
    for filterType in knownFilterTypes {
      let testFilter = filterWithType(filterClass, selector, filterType as NSString)
      if let filter = testFilter as? NSObject {
        print("✅ \(filterType): Available")
        
        // Try to discover properties using reflection
        Self.discoverFilterProperties(filter: filter, filterType: filterType)
      } else {
        print("❌ \(filterType): Not available")
      }
    }
    
    print("=== End Filter Discovery ===")
  }
  
  private static func discoverFilterProperties(filter: NSObject, filterType: String) {
    print("  Properties for \(filterType):")
    
    // Common property names to test
    let commonProperties = [
      "inputRadius",
      "inputAmount", 
      "inputIntensity",
      "inputAngle",
      "inputColor",
      "inputContrast",
      "inputBrightness",
      "inputSaturation",
      "inputOffset",
      "inputScale",
      "inputCenter",
      "inputVector",
      "inputMatrix"
    ]
    
    for property in commonProperties {
      do {
        let value = filter.value(forKey: property)
        if value != nil {
          print("    ✅ \(property): \(String(describing: value))")
        }
      } catch {
        // Property doesn't exist, ignore
      }
    }
  }

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
        
        // Handle contrast filter
        if let contrastAmount = filterConfig["contrast"] as? CGFloat {
          if let filter = getContrastFilter(amount: contrastAmount) {
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
    Self.ensureFiltersDiscovered()  // Trigger filter discovery on first use
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
  
  private func getHueRotateFilter(angle: CGFloat) -> NSObject? {
    guard let FilterClass = Self.FilterClass else { return nil }
    
    let selector = NSSelectorFromString("filterWithType:")
    guard FilterClass.responds(to: selector) else { return nil }
    
    let methodIMP = FilterClass.method(for: selector)
    let filterWithType = unsafeBitCast(methodIMP, to: (@convention(c) (AnyClass, Selector, NSString) -> Any).self)
    let hueAdjustFilter = filterWithType(FilterClass, selector, "colorHueAdjust")
    
    if let filter = hueAdjustFilter as? NSObject {
      // Convert degrees to radians
      let angleInRadians = angle * CGFloat.pi / 180.0
      filter.setValue(angleInRadians, forKey: "inputAngle")
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
  
  private func getSepiaFilter(amount: CGFloat) -> NSObject? {
    guard let FilterClass = Self.FilterClass else { return nil }
    
    let selector = NSSelectorFromString("filterWithType:")
    guard FilterClass.responds(to: selector) else { return nil }
    
    let methodIMP = FilterClass.method(for: selector)
    let filterWithType = unsafeBitCast(methodIMP, to: (@convention(c) (AnyClass, Selector, NSString) -> Any).self)
    let sepiaFilter = filterWithType(FilterClass, selector, "colorMonochrome")
    
    if let filter = sepiaFilter as? NSObject {
      // Set sepia color (brownish tone)
      let sepiaColor = UIColor(red: 0.76, green: 0.69, blue: 0.56, alpha: 1.0)
      filter.setValue(sepiaColor, forKey: "inputColor")
      filter.setValue(amount, forKey: "inputIntensity")
      return filter
    }
    return nil
  }
}

