FILE="${SRCROOT}/Pods/Target Support Files/Pods-${{projectName}}-${{targetName}}/ExpoModulesProvider.swift"
TEMP_FILE="$FILE.temp"

if [ -f "$FILE" ]; then
  echo "Patching $FILE to hide Expo from public interface"
  sed \\
    -e 's/^import EX/internal import EX/' \\
    -e 's/^import Ex/internal import Ex/' \\
    -e 's/public class ExpoModulesProvider/internal class ExpoModulesProvider/' "$FILE" > "$TEMP_FILE"
  mv "$TEMP_FILE" "$FILE"
fi
