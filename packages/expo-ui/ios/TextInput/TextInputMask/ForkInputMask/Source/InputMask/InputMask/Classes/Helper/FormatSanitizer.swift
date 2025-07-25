//
// Project «InputMask»
// Created by Jeorge Taflanidi
//


import Foundation


/**
 ### FormatSanitizer
 
 Sanitizes given `formatString` before it's compilation.
 
 - complexity: `O(2*floor(log(n)))`, and switches to `O(n^2)` for `n < 20` where
 `n = formatString.count`

 - requires: Format string to contain only flat groups of symbols in `[]` and `{}` brackets without nested
 brackets, like `[[000]99]`. Square bracket `[]` groups may contain mixed types of symbols ("0" and "9" with
 "A" and "a" or "_" and "-"), which sanitizer will divide into separate groups. Such that, `[0000Aa]` group will
 be divided in two groups: `[0000]` and `[Aa]`.

 ``FormatSanitizer`` is used by ``Compiler`` before format string compilation.
 */
class FormatSanitizer {
    
    /**
     Sanitize `formatString` before compilation.
     
     In order to do so, sanitizer splits the string into groups of regular symbols, symbols in square brackets `[]` and
     symbols in curly brackets `{}`. Then, characters in square brackets are sorted in a way that mandatory symbols go
     before optional symbols. For instance,
     ```
     a ([0909]) b
     ```
     mask format is rearranged to
     ```
     a ([0099]) b
     ```
     
     Also, ellipsis in square brackets `[]` is always placed at the end.
     
     - complexity: `O(2*floor(log(n)))`, and switches to `O(n^2)` for `n < 20` where
     `n = formatString.count`
     
     - requires: Format string to contain only flat groups of symbols in `[]` and `{}` brackets without nested
     brackets, like `[[000]99]`. Square bracket `[]` groups may contain mixed types of symbols ("0" and "9" with
     "A" and "a" or "_" and "-"), which sanitizer will divide into separate groups. Such that, `[0000Aa]` group will
     be divided in two groups: `[0000]` and `[Aa]`.
     
     - parameter formatString: mask format string.
     
     - returns: Sanitized format string.
     
     - throws: ``Compiler/CompilerError`` if `formatString` does not conform to the method requirements.
     */
    func sanitize(formatString string: String) throws -> String {
        try self.checkOpenBraces(string)
        let blocks: [String] = self.divideBlocksWithMixedCharacters(self.getFormatBlocks(string))
        return self.sortFormatBlocks(blocks).joined(separator: "")
    }
    
}

private extension FormatSanitizer {
    
    func checkOpenBraces(_ string: String) throws {
        var escape:          Bool = false
        var squareBraceOpen: Bool = false
        var curlyBraceOpen:  Bool = false
        
        for char in string {
            if "\\" == char {
                escape = !escape
                continue
            }
            
            if "[" == char {
                if squareBraceOpen {
                    throw Compiler.CompilerError.wrongFormat
                }
                squareBraceOpen = true && !escape
            }
            
            if "]" == char && !escape {
                squareBraceOpen = false
            }
            
            if "{" == char {
                if curlyBraceOpen {
                    throw Compiler.CompilerError.wrongFormat
                }
                curlyBraceOpen = true && !escape
            }
            
            if "}" == char && !escape {
                curlyBraceOpen = false
            }
            
            escape = false
        }
    }
    
    func getFormatBlocks(_ string: String) -> [String] {
        var blocks:       [String] = []
        var currentBlock: String   = ""
        var escape:       Bool     = false
        
        for char in string {
            if "\\" == char {
                if !escape {
                    escape = true
                    currentBlock.append(char)
                    continue
                }
            }
            
            if ("[" == char || "{" == char) && !escape {
                if 0 < currentBlock.count {
                    blocks.append(currentBlock)
                }
                
                currentBlock = ""
            }
            
            currentBlock.append(char)
            
            if ("]" == char || "}" == char) && !escape {
                blocks.append(currentBlock)
                currentBlock = ""
            }
            
            escape = false
        }
        
        if !currentBlock.isEmpty {
            blocks.append(currentBlock)
        }
        
        return blocks
    }
    
    func divideBlocksWithMixedCharacters(_ blocks: [String]) -> [String] {
        var resultingBlocks: [String] = []
        
        for block in blocks {
            if block.hasPrefix("[") {
                var blockBuffer: String = ""
                for blockCharacter in block {
                    if blockCharacter == "[" {
                        blockBuffer.append(blockCharacter)
                        continue
                    }
                    
                    if blockCharacter == "]" && !blockBuffer.hasSuffix("\\") {
                        blockBuffer.append(blockCharacter)
                        resultingBlocks.append(blockBuffer)
                        break
                    }
                    
                    if blockCharacter == "0"
                    || blockCharacter == "9" {
                        if blockBuffer.contains("A")
                        || blockBuffer.contains("a")
                        || blockBuffer.contains("-")
                        || blockBuffer.contains("_") {
                            blockBuffer += "]"
                            resultingBlocks.append(blockBuffer)
                            blockBuffer = "[" + String(blockCharacter)
                            continue
                        }
                    }
                    
                    if blockCharacter == "A"
                    || blockCharacter == "a" {
                        if blockBuffer.contains("0")
                        || blockBuffer.contains("9")
                        || blockBuffer.contains("-")
                        || blockBuffer.contains("_") {
                            blockBuffer += "]"
                            resultingBlocks.append(blockBuffer)
                            blockBuffer = "[" + String(blockCharacter)
                            continue
                        }
                    }
                    
                    if blockCharacter == "-"
                    || blockCharacter == "_" {
                        if blockBuffer.contains("0")
                        || blockBuffer.contains("9")
                        || blockBuffer.contains("A")
                        || blockBuffer.contains("a") {
                            blockBuffer += "]"
                            resultingBlocks.append(blockBuffer)
                            blockBuffer = "[" + String(blockCharacter)
                            continue
                        }
                    }
                    
                    blockBuffer.append(blockCharacter)
                }
            } else {
                resultingBlocks.append(block)
            }
            
        }
        
        return resultingBlocks
    }
    
    func sortFormatBlocks(_ blocks: [String]) -> [String] {
        var sortedBlocks: [String] = []
        
        for block in blocks {
            var sortedBlock: String
            if block.hasPrefix("[") {
                if block.contains("0")
                || block.contains("9") {
                    sortedBlock = self.sortBlock(block: block)
                } else if block.contains("a")
                       || block.contains("A") {
                            sortedBlock = self.sortBlock(block: block)
                } else {
                    sortedBlock =
                        "["
                        + String(block
                                    .replacingOccurrences(of: "[", with: "")
                                    .replacingOccurrences(of: "]", with: "")
                                    .replacingOccurrences(of: "_", with: "A")
                                    .replacingOccurrences(of: "-", with: "a")
                                    .sorted()
                          )
                        + "]"
                    sortedBlock = sortedBlock
                                    .replacingOccurrences(of: "A", with: "_")
                                    .replacingOccurrences(of: "a", with: "-")
                }
            } else {
                sortedBlock = block
            }
            
            sortedBlocks.append(sortedBlock)
        }
        
        return sortedBlocks
    }
    
    private func sortBlock(block: String) -> String {
        return
            "["
            + String(block
                .replacingOccurrences(of: "[", with: "")
                .replacingOccurrences(of: "]", with: "")
                .sorted()
            )
            + "]"
    }
    
}
