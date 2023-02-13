//
//  PaymentSheetAppearance.swift
//  stripe-react-native
//
//  Created by Charles Cruzan on 5/11/22.
//
import StripePaymentSheet

internal class PaymentSheetAppearance {
    class func buildAppearanceFromParams(userParams: NSDictionary?) throws -> PaymentSheet.Appearance {
        var appearance = PaymentSheet.Appearance()
        guard let userParams = userParams else { return appearance }
        
        if let fontParams = userParams[PaymentSheetAppearanceKeys.FONT] as? NSDictionary {
            appearance.font = try buildFont(params: fontParams)
        }
        if let colorParams = userParams[PaymentSheetAppearanceKeys.COLORS] as? NSDictionary {
            appearance.colors = try buildColors(params: colorParams)
        }
        if let shapeParams = userParams[PaymentSheetAppearanceKeys.SHAPES] as? NSDictionary {
            appearance.cornerRadius = shapeParams[PaymentSheetAppearanceKeys.BORDER_RADIUS] as? CGFloat ?? PaymentSheet.Appearance.default.cornerRadius
            appearance.borderWidth = shapeParams[PaymentSheetAppearanceKeys.BORDER_WIDTH] as? CGFloat ?? PaymentSheet.Appearance.default.borderWidth
            if let shadowParams = shapeParams[PaymentSheetAppearanceKeys.SHADOW] as? NSDictionary {
                appearance.shadow = try buildShadow(params: shadowParams)
            }
        }
        if let primaryButtonParams = userParams[PaymentSheetAppearanceKeys.PRIMARY_BUTTON] as? NSDictionary {
            appearance.primaryButton = try buildPrimaryButton(params: primaryButtonParams)
        }
        
        return appearance
    }
    
    private class func buildFont(params: NSDictionary) throws -> PaymentSheet.Appearance.Font {
        var font = PaymentSheet.Appearance.Font()
        if let fontName = params[PaymentSheetAppearanceKeys.FAMILY] as? String {
            guard let customFont = UIFont(name: fontName, size: UIFont.systemFontSize) else {
                throw PaymentSheetAppearanceError.missingFont(fontName)
            }
            font.base = customFont
        }
        font.sizeScaleFactor = params[PaymentSheetAppearanceKeys.SCALE] as? CGFloat ?? PaymentSheet.Appearance.default.font.sizeScaleFactor
        return font
    }

    private class func buildColors(params: NSDictionary) throws -> PaymentSheet.Appearance.Colors {
        var colors = PaymentSheet.Appearance.Colors()
        
        if (params.object(forKey: PaymentSheetAppearanceKeys.LIGHT) != nil && params.object(forKey: PaymentSheetAppearanceKeys.DARK) == nil ||
            params.object(forKey: PaymentSheetAppearanceKeys.DARK) != nil && params.object(forKey: PaymentSheetAppearanceKeys.LIGHT) == nil) {
            throw PaymentSheetAppearanceError.missingAppearanceMode
        }
        
        let lightModeParams = params[PaymentSheetAppearanceKeys.LIGHT] as? NSDictionary ?? params
        let darkModeParams = params[PaymentSheetAppearanceKeys.DARK] as? NSDictionary ?? params
        
        colors.primary = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.PRIMARY, lightParams: lightModeParams, darkParams: darkModeParams) ?? PaymentSheet.Appearance.default.colors.primary
        colors.background = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.BACKGROUND, lightParams: lightModeParams, darkParams: darkModeParams) ?? PaymentSheet.Appearance.default.colors.background
        colors.componentBackground = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.COMPONENT_BACKGROUND, lightParams: lightModeParams, darkParams: darkModeParams) ?? PaymentSheet.Appearance.default.colors.componentBackground
        colors.componentBorder = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.COMPONENT_BORDER, lightParams: lightModeParams, darkParams: darkModeParams) ?? PaymentSheet.Appearance.default.colors.componentBorder
        colors.componentDivider = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.COMPONENT_DIVIDER, lightParams: lightModeParams, darkParams: darkModeParams) ?? PaymentSheet.Appearance.default.colors.componentDivider
        colors.text = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.PRIMARY_TEXT, lightParams: lightModeParams, darkParams: darkModeParams) ?? PaymentSheet.Appearance.default.colors.text
        colors.textSecondary = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.SECONDARY_TEXT, lightParams: lightModeParams, darkParams: darkModeParams) ?? PaymentSheet.Appearance.default.colors.textSecondary
        colors.componentText = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.COMPONENT_TEXT, lightParams: lightModeParams, darkParams: darkModeParams) ?? PaymentSheet.Appearance.default.colors.componentText
        colors.componentPlaceholderText = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.PLACEHOLDER_TEXT, lightParams: lightModeParams, darkParams: darkModeParams) ?? PaymentSheet.Appearance.default.colors.componentPlaceholderText
        colors.icon = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.ICON, lightParams: lightModeParams, darkParams: darkModeParams) ?? PaymentSheet.Appearance.default.colors.icon
        colors.danger = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.ERROR, lightParams: lightModeParams, darkParams: darkModeParams) ?? PaymentSheet.Appearance.default.colors.danger
        
        return colors
    }
    
    private class func buildShadow(params: NSDictionary) throws -> PaymentSheet.Appearance.Shadow {
        var shadow = PaymentSheet.Appearance.Shadow()
        
        if let color = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.SHADOW_COLOR, lightParams: params, darkParams: params) {
            shadow.color = color
        }
        if let opacity = params[PaymentSheetAppearanceKeys.OPACITY] as? CGFloat {
            shadow.opacity = opacity
        }
        if let radius = params[PaymentSheetAppearanceKeys.BLUR_RADIUS] as? CGFloat {
            shadow.radius = radius
        }
        if let offsetParams = params[PaymentSheetAppearanceKeys.OFFSET] as? NSDictionary {
            if let x = offsetParams[PaymentSheetAppearanceKeys.X] as? CGFloat, let y = offsetParams[PaymentSheetAppearanceKeys.Y] as? CGFloat {
                shadow.offset = CGSize(width: x, height:-y)
            }
        }

        return shadow
    }
    
    private class func buildPrimaryButton(params: NSDictionary) throws -> PaymentSheet.Appearance.PrimaryButton {
        var primaryButton = PaymentSheet.Appearance.PrimaryButton()
        
        if let fontName = (params[PaymentSheetAppearanceKeys.FONT] as? NSDictionary)?[PaymentSheetAppearanceKeys.FAMILY] as? String {
            guard let customFont = UIFont(name: fontName, size: UIFont.systemFontSize) else {
                throw PaymentSheetAppearanceError.missingFont(fontName)
            }
            primaryButton.font = customFont
        }
        if let shapeParams = params[PaymentSheetAppearanceKeys.SHAPES] as? NSDictionary {
            if let borderRadius = shapeParams[PaymentSheetAppearanceKeys.BORDER_RADIUS] as? CGFloat {
                primaryButton.cornerRadius = borderRadius
            }
            if let borderWidth = shapeParams[PaymentSheetAppearanceKeys.BORDER_WIDTH] as? CGFloat {
                primaryButton.borderWidth = borderWidth
            }
            if let shadowParams = shapeParams[PaymentSheetAppearanceKeys.SHADOW] as? NSDictionary {
                primaryButton.shadow = try buildShadow(params: shadowParams)
            }
        }
        if let colorParams = params[PaymentSheetAppearanceKeys.COLORS] as? NSDictionary {
            if (colorParams.object(forKey: PaymentSheetAppearanceKeys.LIGHT) != nil && colorParams.object(forKey: PaymentSheetAppearanceKeys.DARK) == nil ||
                colorParams.object(forKey: PaymentSheetAppearanceKeys.DARK) != nil && colorParams.object(forKey: PaymentSheetAppearanceKeys.LIGHT) == nil) {
                throw PaymentSheetAppearanceError.missingAppearanceMode
            }
            
            let lightModeParams = colorParams[PaymentSheetAppearanceKeys.LIGHT] as? NSDictionary ?? colorParams
            let darkModeParams = colorParams[PaymentSheetAppearanceKeys.DARK] as? NSDictionary ?? colorParams
            
            primaryButton.backgroundColor = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.BACKGROUND, lightParams: lightModeParams, darkParams: darkModeParams)
            primaryButton.textColor = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.TEXT, lightParams: lightModeParams, darkParams: darkModeParams)
            primaryButton.borderColor = try buildUserInterfaceStyleAwareColor(key: PaymentSheetAppearanceKeys.BORDER, lightParams: lightModeParams, darkParams: darkModeParams) ?? PaymentSheet.Appearance.default.primaryButton.borderColor
        }
        
        return primaryButton
    }
    
    private class func buildUserInterfaceStyleAwareColor(key: String, lightParams: NSDictionary, darkParams: NSDictionary) throws -> UIColor? {
        guard let lightHexString = lightParams[key] as? String, let darkHexString = darkParams[key] as? String else {
            return nil
        }
        
        let darkCount = darkHexString.trimmingCharacters(in: CharacterSet.alphanumerics.inverted).count
        let lightCount = lightHexString.trimmingCharacters(in: CharacterSet.alphanumerics.inverted).count
        if (lightCount != 6 && lightCount != 8) {
            throw PaymentSheetAppearanceError.unexpectedHexStringLength(lightHexString)
        } else if (darkCount != 6 && darkCount != 8) {
            throw PaymentSheetAppearanceError.unexpectedHexStringLength(darkHexString)
        }
        
        let lightColor = UIColor(hexString: lightHexString)
        let darkColor = UIColor(hexString: darkHexString)
        
        if #available(iOS 13.0, *) {
            return UIColor.init { traits in
                return traits.userInterfaceStyle == .dark ? darkColor : lightColor
            }
        } else {
            return lightColor
        }
    }
}

enum PaymentSheetAppearanceError : Error {
    case missingFont(String)
    case missingAppearanceMode
    case unexpectedHexStringLength(String)
}
    
extension PaymentSheetAppearanceError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .missingFont(let fontFamily):
            return NSLocalizedString("Failed to set Payment Sheet appearance. Unable to find font: \(fontFamily)", comment: "Failed to set font")
        case .missingAppearanceMode:
            return NSLocalizedString("Failed to set Payment Sheet appearance. When providing 'colors.light' or 'colors.dark', you must provide both.", comment: "Failed to set colors")
        case .unexpectedHexStringLength(let hexString):
            return NSLocalizedString("Failed to set Payment Sheet appearance. Expected hex string of length 6 or 8, but received: \(hexString)", comment: "Failed to set color")
        }
    }
}

private struct PaymentSheetAppearanceKeys {
    static let COLORS = "colors"
    static let LIGHT = "light"
    static let DARK = "dark"
    static let PRIMARY = "primary"
    static let BACKGROUND = "background"
    static let COMPONENT_BACKGROUND = "componentBackground"
    static let COMPONENT_BORDER = "componentBorder"
    static let COMPONENT_DIVIDER = "componentDivider"
    static let COMPONENT_TEXT = "componentText"
    static let PRIMARY_TEXT = "primaryText"
    static let SECONDARY_TEXT = "secondaryText"
    static let PLACEHOLDER_TEXT = "placeholderText"
    static let ICON = "icon"
    static let ERROR = "error"
    
    static let FONT = "font"
    static let FAMILY = "family"
    static let SCALE = "scale"
    
    static let SHAPES = "shapes"
    static let BORDER_RADIUS = "borderRadius"
    static let BORDER_WIDTH = "borderWidth"

    static let SHADOW = "shadow"
    static let SHADOW_COLOR = "color"
    static let OPACITY = "opacity"
    static let OFFSET = "offset"
    static let BLUR_RADIUS = "blurRadius"
    static let X = "x"
    static let Y = "y"
    
    static let PRIMARY_BUTTON = "primaryButton"
    static let TEXT = "text"
    static let BORDER = "border"
}
