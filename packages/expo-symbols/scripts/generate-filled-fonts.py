#!/usr/bin/env python3
"""Generates the filled Material Symbols fonts behind `expo-symbols/androidWeights/*Filled`.

The static cuts from `@expo-google-fonts/material-symbols` have no FILL axis: every glyph is the
outlined form, and the legacy `*_filled` codepoints map to that same outlined glyph. This script
instantiates Google's variable Material Symbols font at FILL 1 for each of the seven weights the
package already offers, at opsz 24 and GRAD 0 (the values of the static cuts, so a filled glyph
lines up with its outlined twin), keeping the codepoints listed in `src/android/symbols.json`.
Ligature tables are dropped: glyphs are drawn by codepoint.

Requires Python 3 with fontTools (`pip3 install fonttools`). Run from anywhere:

    python3 packages/expo-symbols/scripts/generate-filled-fonts.py
"""

import hashlib
import json
import sys
import urllib.request
from io import BytesIO
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

PACKAGE = Path(__file__).resolve().parent.parent
SYMBOLS = PACKAGE / 'src/android/symbols.json'
OUT = PACKAGE / 'assets/fonts'

# Pinned so a regeneration is reproducible; bump both together to pick up newer glyphs.
SOURCE_COMMIT = 'bd8cb85bd4bad964fe6918f79665bb40c3a8efef'
SOURCE_SHA256 = '0128da5981791d2fe09918c337ea6657b0ef2e4e5f8f4af3e1dc5f31889b2311'
SOURCE_URL = (
    'https://github.com/google/material-design-icons/raw/'
    f'{SOURCE_COMMIT}/variablefont/MaterialSymbolsOutlined%5BFILL,GRAD,opsz,wght%5D.ttf'
)

WEIGHTS = {
    'MaterialSymbols_100Thin_Filled': 100,
    'MaterialSymbols_200ExtraLight_Filled': 200,
    'MaterialSymbols_300Light_Filled': 300,
    'MaterialSymbols_400Regular_Filled': 400,
    'MaterialSymbols_500Medium_Filled': 500,
    'MaterialSymbols_600SemiBold_Filled': 600,
    'MaterialSymbols_700Bold_Filled': 700,
}


def main() -> int:
    with urllib.request.urlopen(SOURCE_URL) as response:
        source = response.read()
    digest = hashlib.sha256(source).hexdigest()
    if digest != SOURCE_SHA256:
        print(f'Unexpected source font sha256: {digest}', file=sys.stderr)
        return 1

    codepoints = set(json.loads(SYMBOLS.read_text()).values())
    OUT.mkdir(parents=True, exist_ok=True)
    for name, weight in WEIGHTS.items():
        font = TTFont(BytesIO(source))
        options = subset.Options()
        options.layout_features = []
        options.name_IDs = ['*']
        options.notdef_outline = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=codepoints & set(font.getBestCmap()))
        subsetter.subset(font)
        font = instancer.instantiateVariableFont(
            font, {'FILL': 1, 'wght': weight, 'opsz': 24, 'GRAD': 0}
        )
        # Keep the source's timestamp so an unchanged regeneration is byte-identical.
        font.recalcTimestamp = False
        font.save(OUT / f'{name}.ttf')
        print(f'{name}.ttf: {(OUT / f"{name}.ttf").stat().st_size // 1024} KB')
    return 0


if __name__ == '__main__':
    sys.exit(main())
