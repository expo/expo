### Updating vendored modules

Anything in `modules` in Expo Go means we vendor it and apply some Expo-Go-specific patches located in `tools/src/vendoring/config`.

To update a module here, run (example) `et uvm  react-native-view-shot -c "4.0.3"`. This will update the module to the specified version and apply the patches.
