---
"expo-linear-gradient": patch
---

[iOS] Draw gradients with `CAGradientLayer` instead of painting each one into a screen-sized bitmap, which used width × height × scale² × 4 bytes of memory per gradient.
