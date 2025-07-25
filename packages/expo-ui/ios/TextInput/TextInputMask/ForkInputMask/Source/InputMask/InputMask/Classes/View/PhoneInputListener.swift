//
// Project «InputMask»
// Created by Jeorge Taflanidi
//

#if canImport(UIKit) && canImport(Foundation) && !os(watchOS)

import Foundation

/**
 ### PhoneInputListener
 
 A ``MaskedTextInputListener`` subclass for guessing a country based on the entered digit sequence
 
 Computed country dictates the phone formatting
 */
open class PhoneInputListener: MaskedTextInputListener {
    /**
     A detected ``Country`` based on the entered digits
     */
    open private(set) var computedCountry: Country?
    
    /**
     A list of possible ``Country`` candidates based on the entered digits
     */
    open private(set) var computedCountries: [Country] = []
    
    /**
     Allowed ``Country`` list. Pre-filters the ``Country/all`` dictionary.
     
     May contain country names, native country names, ISO-3166 codes, country emojis, or their mix.
     
     E.g.
     ```
     listener.enableCountries = [
       "Greece",
       "BE",
       "🇪🇸"
     ]
     ```
     */
    open var enableCountries: [String]?
    
    /**
     Blocked ``Country`` list. Pre-filters the ``Country/all`` dictionary.
     
     May contain country names, native country names, ISO-3166 codes, country emojis, or their mix.
     
     E.g.
     ```
     listener.disableCountries = [
       "Greece",
       "BE",
       "🇪🇸"
     ]
     ```
     */
    open var disableCountries: [String]?
    
    /**
     A custom ``Country`` list to be used instead of ``Country/all`` dictionary.
     */
    open var customCountries: [Country]?
    
    open override func pickMask(forText text: CaretString) -> Mask {
        computedCountries = Country.findCountries(amongCountries: customCountries, withTerms: enableCountries, excluding: disableCountries, phone: text.string)
        computedCountry = computedCountries.count == 1 ? computedCountries.first : nil
        
        guard
            let country = computedCountry
        else {
            return try! Mask(format: "+[000] [000] [000] [00] [00]")
        }

        primaryMaskFormat = country.primaryFormat
        affineFormats = country.affineFormats
        
        return super.pickMask(forText: text)
    }
}

#endif
