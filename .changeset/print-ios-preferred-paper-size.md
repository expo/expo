---
'expo-print': patch
---

[iOS] Add the `preferredPaperSize` option to `printAsync`. The print dialog, or a job sent to `printerUrl`, then selects the paper that best fits the given size in points, for example 4 x 6 inch paper for a recipe card, instead of the printer's default paper.
