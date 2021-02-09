//
//  LayerFontProvider.swift
//  Lottie
//
//  Created by Brandon Withrow on 8/5/20.
//  Copyright © 2020 YurtvilleProds. All rights reserved.
//

import Foundation

/// Connects a LottieFontProvider to a group of text layers
final class LayerFontProvider {
    
    var fontProvider: AnimationFontProvider {
        didSet {
            reloadTexts()
        }
    }
    
    fileprivate(set) var textLayers: [TextCompositionLayer]
    
    init(fontProvider: AnimationFontProvider) {
        self.fontProvider = fontProvider
        self.textLayers = []
        reloadTexts()
    }

    func addTextLayers(_ layers: [TextCompositionLayer]) {
        textLayers += layers
    }
        
    func reloadTexts() {
        textLayers.forEach {
            $0.fontProvider = fontProvider
        }
    }
}
