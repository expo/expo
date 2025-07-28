//
//  Manager.swift
//  teste4
//
//  Created by Joao Morais on 18/07/25.
//

class MaskFormatter{
    
    private let maskManager: Mask?
    
    public init(mask:String){
        do{
            self.maskManager = try Mask(format: mask)
        }catch{
            self.maskManager = nil
        }
    }
    
    public func applyMask(text: String,mask:String) -> String {

        let caretString = CaretString(
            string: text,
            caretPosition: text.endIndex,
            caretGravity: .forward(autocomplete: false)
        )
        guard let maskManager = self.maskManager else{
            return ""
        }
        let result = maskManager.apply(toText: caretString)
        return result.formattedText.string
    }
}
