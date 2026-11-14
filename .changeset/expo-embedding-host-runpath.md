---
'expo-embedding': patch
---

Add the embedded Frameworks runtime search path when configuring an iOS host, preserving existing paths so apps without Xcode's default runpath can launch.
