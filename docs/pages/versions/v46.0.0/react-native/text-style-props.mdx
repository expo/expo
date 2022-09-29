---
id: text-style-props
title: Text Style Props
---

### Example

```js
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  Slider,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const fontStyles = ['normal', 'italic'];
const fontVariants = [
  undefined,
  'small-caps',
  'oldstyle-nums',
  'lining-nums',
  'tabular-nums',
  'proportional-nums',
];
const fontWeights = [
  'normal',
  'bold',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
];
const textAlignments = ['auto', 'left', 'right', 'center', 'justify'];
const textDecorationLines = ['none', 'underline', 'line-through', 'underline line-through'];
const textDecorationStyles = ['solid', 'double', 'dotted', 'dashed'];
const textTransformations = ['none', 'uppercase', 'lowercase', 'capitalize'];
const textAlignmentsVertical = ['auto', 'top', 'bottom', 'center'];
const writingDirections = ['auto', 'ltr', 'rtl'];

const App = () => {
  const [fontSize, setFontSize] = useState(10);
  const [fontStyleIdx, setFontStyleIdx] = useState(0);
  const [fontWeightIdx, setFontWeightIdx] = useState(0);
  const [lineHeight, setLineHeight] = useState(10);
  const [textAlignIdx, setTextAlignIdx] = useState(0);
  const [textDecorationLineIdx, setTextDecorationLineIdx] = useState(0);
  const [includeFontPadding, setIncludeFontPadding] = useState(false);
  const [textVerticalAlignIdx, setTextVerticalAlignIdx] = useState(0);
  const [fontVariantIdx, setFontVariantIdx] = useState(0);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textDecorationStyleIdx, setTextDecorationStyleIdx] = useState(0);
  const [textTransformIdx, setTextTransformIdx] = useState(0);
  const [writingDirectionIdx, setWritingDirectionIdx] = useState(0);
  const [textShadowRadius, setTextShadowRadius] = useState(0);
  const [textShadowOffset, setTextShadowOffset] = useState({
    height: 0,
    width: 0,
  });

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.paragraph,
          {
            fontSize,
            fontStyle: fontStyles[fontStyleIdx],
            fontWeight: fontWeights[fontWeightIdx],
            lineHeight,
            textAlign: textAlignments[textAlignIdx],
            textDecorationLine: textDecorationLines[textDecorationLineIdx],
            textTransform: textTransformations[textTransformIdx],
            textAlignVertical: textAlignmentsVertical[textVerticalAlignIdx],
            fontVariant: [fontVariants[fontVariantIdx]],
            letterSpacing,
            includeFontPadding,
            textDecorationStyle: textDecorationStyles[textDecorationStyleIdx],
            writingDirection: writingDirections[writingDirectionIdx],
            textShadowOffset,
            textShadowRadius,
          },
        ]}>
        Lorem Ipsum is simply dummy text of the printing and typesetting industry. 112 Likes
      </Text>
      <ScrollView>
        <View>
          <Text>Common platform properties</Text>
          <CustomSlider
            label="Text Shadow Offset - Height"
            value={textShadowOffset.height}
            minimumValue={-40}
            maximumValue={40}
            handleValueChange={val => setTextShadowOffset(prev => ({ ...prev, height: val }))}
          />
          <CustomSlider
            label="Text Shadow Offset - Width"
            value={textShadowOffset.width}
            minimumValue={-40}
            maximumValue={40}
            handleValueChange={val => setTextShadowOffset(prev => ({ ...prev, width: val }))}
          />
          <CustomSlider
            label="Font Size"
            value={fontSize}
            maximumValue={40}
            handleValueChange={setFontSize}
          />
          <CustomPicker
            label="Font Style"
            data={fontStyles}
            currentIndex={fontStyleIdx}
            onSelected={setFontStyleIdx}
          />
          <CustomPicker
            label="Font Weight"
            data={fontWeights}
            currentIndex={fontWeightIdx}
            onSelected={setFontWeightIdx}
          />
          <CustomSlider
            label="Line Height"
            value={lineHeight}
            minimumValue={10}
            maximumValue={50}
            handleValueChange={setLineHeight}
          />
          <CustomPicker
            label="Text Align"
            data={textAlignments}
            currentIndex={textAlignIdx}
            onSelected={setTextAlignIdx}
          />
          <CustomPicker
            label="Text Decoration Line"
            data={textDecorationLines}
            currentIndex={textDecorationLineIdx}
            onSelected={setTextDecorationLineIdx}
          />
          <CustomSlider
            label="Text Shadow Radius"
            value={textShadowRadius}
            handleValueChange={setTextShadowRadius}
          />
          <CustomPicker
            label="Font Variant"
            data={fontVariants}
            currentIndex={fontVariantIdx}
            onSelected={setFontVariantIdx}
          />
          <CustomSlider
            label="Letter Spacing"
            step={0.1}
            value={letterSpacing}
            handleValueChange={setLetterSpacing}
          />
          <CustomPicker
            label="Text Transform"
            data={textTransformations}
            currentIndex={textTransformIdx}
            onSelected={setTextTransformIdx}
          />
        </View>
        {Platform.OS === 'android' && (
          <View style={styles.platformContainer}>
            <Text style={styles.platformContainerTitle}>Android only properties</Text>
            <CustomPicker
              label="Text Vertical Align"
              data={textAlignmentsVertical}
              currentIndex={textVerticalAlignIdx}
              onSelected={setTextVerticalAlignIdx}
            />
            <CustomSwitch
              label="Include Font Padding"
              handleValueChange={setIncludeFontPadding}
              value={includeFontPadding}
            />
          </View>
        )}
        {Platform.OS === 'ios' && (
          <View style={styles.platformContainer}>
            <Text style={styles.platformContainerTitle}>iOS only properties</Text>
            <CustomPicker
              label="Text Decoration Style"
              data={textDecorationStyles}
              currentIndex={textDecorationStyleIdx}
              onSelected={setTextDecorationStyleIdx}
            />
            <CustomPicker
              label="Writing Direction"
              data={writingDirections}
              currentIndex={writingDirectionIdx}
              onSelected={setWritingDirectionIdx}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const CustomSwitch = ({ label, handleValueChange, value }) => {
  return (
    <>
      <Text style={styles.title}>{label}</Text>
      <View style={{ alignItems: 'flex-start' }}>
        <Switch
          trackColor={{ false: '#767577', true: '#DAA520' }}
          thumbColor={value ? '#DAA520' : '#f4f3f4'}
          onValueChange={handleValueChange}
          value={value}
        />
      </View>
    </>
  );
};

const CustomSlider = ({
                        label,
                        handleValueChange,
                        step = 1,
                        minimumValue = 0,
                        maximumValue = 10,
                        value,
                      }) => {
  return (
    <>
      {label && <Text style={styles.title}>{`${label} (${value.toFixed(2)})`}</Text>}
      <View style={styles.wrapperHorizontal}>
        <Slider
          thumbTintColor="#DAA520"
          minimumTrackTintColor="#DAA520"
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          onValueChange={handleValueChange}
          value={value}
        />
      </View>
    </>
  );
};

const CustomPicker = ({ label, data, currentIndex, onSelected }) => {
  return (
    <>
      <Text style={styles.title}>{label}</Text>
      <View style={styles.wrapperHorizontal}>
        <FlatList
          bounces
          horizontal
          data={data}
          keyExtractor={(item, idx) => String(item)}
          renderItem={({ item, index }) => {
            const selected = index === currentIndex;
            return (
              <TouchableWithoutFeedback onPress={() => onSelected(index)}>
                <View
                  style={[
                    styles.itemStyleHorizontal,
                    selected && styles.itemSelectedStyleHorizontal,
                  ]}>
                  <Text
                    style={{
                      textAlign: 'center',
                      color: selected ? 'black' : 'grey',
                      fontWeight: selected ? 'bold' : 'normal',
                    }}>
                    {item + ''}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            );
          }}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  paragraph: {
    color: 'black',
    textDecorationColor: 'yellow',
    textShadowColor: 'red',
    textShadowRadius: 1,
    margin: 24,
  },
  wrapperHorizontal: {
    height: 54,
    justifyContent: 'center',
    color: 'black',
    marginBottom: 12,
  },
  itemStyleHorizontal: {
    marginRight: 10,
    height: 50,
    padding: 8,
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 25,
    textAlign: 'center',
    justifyContent: 'center',
  },
  itemSelectedStyleHorizontal: {
    borderWidth: 2,
    borderColor: '#DAA520',
  },
  platformContainer: {
    marginTop: 8,
    borderTopWidth: 1,
  },
  platformContainerTitle: {
    marginTop: 8,
  },
  title: {
    fontWeight: 'bold',
    marginVertical: 4,
  },
});

export default App;
```

# Reference

## Props

### `color`

| Type                                              |
| ------------------------------------------------- |
| [color](https://reactnative.dev/docs/0.64/colors) |

---

### `fontFamily`

| Type   |
| ------ |
| string |

---

### `fontSize`

| Type   |
| ------ |
| number |

---

### `fontStyle`

| Type                         |
| ---------------------------- |
| enum(`'normal'`, `'italic'`) |

---

### `fontWeight`

Specifies font weight. The values `'normal'` and `'bold'` are supported for most fonts. Not all fonts have a variant for each of the numeric values, in that case the closest one is chosen.

| Type                                                                                                        | Default    |
| ----------------------------------------------------------------------------------------------------------- | ---------- |
| enum(`'normal'`, `'bold'`, `'100'`, `'200'`, `'300'`, `'400'`, `'500'`, `'600'`, `'700'`, `'800'`, `'900'`) | `'normal'` |

---

### `includeFontPadding` **(Android)**

Set to `false` to remove extra font padding intended to make space for certain ascenders / descenders. With some fonts, this padding can make text look slightly misaligned when centered vertically. For best results also set `textAlignVertical` to `center`.

| Type | Default |
| ---- | ------- |
| bool | `true`  |

---

### `fontVariant`

| Type                                                                                                       | Default |
| ---------------------------------------------------------------------------------------------------------- | ------- |
| array of enum(`'small-caps'`, `'oldstyle-nums'`, `'lining-nums'`, `'tabular-nums'`, `'proportional-nums'`) | `[]`    |

---

### `letterSpacing`

Increase or decrease the spacing between characters. By default there is no extra letter spacing.

| Type   |
| ------ |
| number |

---

### `lineHeight`

| Type   |
| ------ |
| number |

---

### `textAlign`

Specifies text alignment. On Android, the value 'justify' is only supported on Oreo (8.0) or above (API level >= 26). The value will fallback to `left` on lower Android versions.

| Type                                                         | Default  |
| ------------------------------------------------------------ | -------- |
| enum(`'auto'`, `'left'`, `'right'`, `'center'`, `'justify'`) | `'auto'` |

---

### `textAlignVertical` **(Android)**

| Type                                            | Default  |
| ----------------------------------------------- | -------- |
| enum(`'auto'`, `'top'`, `'bottom'`, `'center'`) | `'auto'` |

---

### `textDecorationColor` **(iOS)**

| Type                                              |
| ------------------------------------------------- |
| [color](https://reactnative.dev/docs/0.64/colors) |

---

### `textDecorationLine`

| Type                                                                        | Default  |
| --------------------------------------------------------------------------- | -------- |
| enum(`'none'`, `'underline'`, `'line-through'`, `'underline line-through'`) | `'none'` |

---

### `textDecorationStyle` **(iOS)**

| Type                                                | Default   |
| --------------------------------------------------- | --------- |
| enum(`'solid'`, `'double'`, `'dotted'`, `'dashed'`) | `'solid'` |

---

### `textShadowColor`

| Type                                              |
| ------------------------------------------------- |
| [color](https://reactnative.dev/docs/0.64/colors) |

---

### `textShadowOffset`

| Type                                                      |
|-----------------------------------------------------------|
| object: &lbrace; width?: number, height?: number &rbrace; |

---

### `textShadowRadius`

| Type   |
| ------ |
| number |

---

### `textTransform`

| Type                                                         | Default  |
| ------------------------------------------------------------ | -------- |
| enum(`'none'`, `'uppercase'`, `'lowercase'`, `'capitalize'`) | `'none'` |

---

### `writingDirection` **(iOS)**

| Type                             | Default  |
| -------------------------------- | -------- |
| enum(`'auto'`, `'ltr'`, `'rtl'`) | `'auto'` |
