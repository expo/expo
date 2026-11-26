---
'expo-dev-menu': patch
---

[iOS] The prebuilt Release XCFramework is now an empty stub. It has the same headers and modules as the Debug XCFramework. A Release app that links it gets no `expo-dev-menu` code. The dev menu also finds its images inside the prebuilt framework.
