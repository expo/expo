## Android Color Types

Android color types were generated from the [Android documentation](https://developer.android.com/reference/android/R.color) using following script:

```js
function scrapColorsWithAPILevels() {
  const colors = Array.from(
    document.querySelectorAll("div[data-version-added]")
  )
    .map((div) => {
      const name = div.querySelector("h3.api-name")?.getAttribute("data-text");
      const addedIn = parseInt(div.getAttribute("data-version-added"), 10);
      const deprecatedIn = parseInt(
        div.getAttribute("data-version-deprecated"),
        10
      );

      return { name, addedIn, deprecatedIn };
    })
    .filter((c) => c.name && !isNaN(c.addedIn));
  const grouped = {};

  for (const c of colors) {
    if(!c.deprecatedIn) {
      if (!grouped[c.addedIn]) grouped[c.addedIn] = [];
      grouped[c.addedIn].push(c.name);
    }
  }

  // --- Collect deprecated colors ---
  const deprecated = colors.filter((c) => c.deprecatedIn).map((c) => c.name);

  // --- Generate TS output ---
  let output = "";

  for (const sdk of Object.keys(grouped).sort(
    (a, b) => Number(a) - Number(b)
  )) {
    const names = grouped[sdk];
    output += `export interface AndroidBaseColorSDK${sdk} {\n`;
    for (const n of names) {
      output += `  /**\n`;
      output += `   * PlatformColor("@android:color/${n}")\n`;
      output += `   *\n`;
      output += `   * @since Android SDK ${sdk}\n`;
      output += `   */\n`;
      output += `  ${n}: ColorValue;\n`;
    }
    output += `}\n\n`;
  }

  if (deprecated.length > 0) {
    output += `export interface AndroidDeprecatedColor {\n`;
    for (const c of colors.filter((col) => col.deprecatedIn)) {
      output += `  /**\n`;
      output += `   * PlatformColor("@android:color/${c.name}")\n`;
      output += `   *\n`;
      output += `   * @deprecated Deprecated in Android SDK ${c.deprecatedIn}\n`;
      output += `   * @since Android SDK ${c.addedIn}\n`;
      output += `   */\n`;
      output += `  ${c.name}: ColorValue;\n`;
    }
    output += `}\n\n`;
  }

  return output;
}
console.log(scrapColorsWithAPILevels());
```

## Android Attr Types

Android attr types were generated from the [Android documentation](https://developer.android.com/reference/android/R.attr) using following script:

```js
function scrapColorsAttrWithAPILevels() {
  const colors = Array.from(
    document.querySelectorAll("div[data-version-added]")
  )
    .map((div) => {
      const name = div.querySelector("h3.api-name")?.getAttribute("data-text");
      const addedIn = parseInt(div.getAttribute("data-version-added"), 10);
      const deprecatedIn = parseInt(
        div.getAttribute("data-version-deprecated"),
        10
      );

      return { name, addedIn, deprecatedIn };
    })
    .filter((c) => c.name && !isNaN(c.addedIn) && c.name.startsWith("color") && c.name !== "color");
  const grouped = {};

  for (const c of colors) {
    if(!c.deprecatedIn) {
      if (!grouped[c.addedIn]) grouped[c.addedIn] = [];
      grouped[c.addedIn].push(c.name);
    }
  }

  // --- Collect deprecated colors ---
  const deprecated = colors.filter((c) => c.deprecatedIn).map((c) => c.name);

  // --- Generate TS output ---
  let output = "";

  for (const sdk of Object.keys(grouped).sort(
    (a, b) => Number(a) - Number(b)
  )) {
    const names = grouped[sdk];
    output += `export interface AndroidColorAttrSDK${sdk} {\n`;
    for (const n of names) {
      output += `  /**\n`;
      output += `   * PlatformColor("?attr/${n}")\n`;
      output += `   *\n`;
      output += `   * @since Android SDK ${sdk}\n`;
      output += `   */\n`;
      output += `  ${n}: ColorValue;\n`;
    }
    output += `}\n\n`;
  }

  if (deprecated.length > 0) {
    output += `export interface AndroidDeprecatedColorAttr {\n`;
    for (const c of colors.filter((col) => col.deprecatedIn)) {
      output += `  /**\n`;
      output += `   * PlatformColor("?attr/${c.name}")\n`;
      output += `   *\n`;
      output += `   * @deprecated Deprecated in Android SDK ${c.deprecatedIn}\n`;
      output += `   * @since Android SDK ${c.addedIn}\n`;
      output += `   */\n`;
      output += `  ${c.name}: ColorValue;\n`;
    }
    output += `}\n\n`;
  }

  return output;
}
console.log(scrapColorsAttrWithAPILevels());
```