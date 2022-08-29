---
title: Create a modal
---

import SnackInline from '~/components/plugins/SnackInline';
import ImageSpotlight from '~/components/plugins/ImageSpotlight';
import Video from '~/components/plugins/Video';

React Native provides a [`Modal` component](https://reactnative.dev/docs/modal) to present the content above an underlying view. In general, Modals are used to draw a user's attention toward some critical information or guide them to take action to trigger the next step in an ongoing process.

A modal can be the new view that disables the previous or the underlying view and covers up the whole screen or a certain amount percentage of the screen. In this module, let's create a modal that shows an emoji picker list.

## Step 1: Declare a state variable to show buttons

Before implementing the modal, you have to add three new buttons. These buttons are only visible when the user has picked an image from the media library or decided to use the placeholder image. One of these buttons will be used to trigger the modal.

Declare a state variable called `showAppOptions` in the **App.js** file. This variable will be used to show or hide buttons to open the modal and a few other options.

The value of this variable is a boolean; when the app screen loads, it is set to `false` so that the options are not shown before picking an image.

```js
export default function App() {
  const [showAppOptions, setShowAppOptions] = useState(false);
  // ...
}
```

The value of this variable will be set to true when the user has picked an image from the media library or decided to use the placeholder image.

Next, modify the `pickImageHandler()` method to set the value of `showAppOptions` to `true` after the user has picked an image.

<!-- prettier-ignore -->
```js
const pickImageHandler = async () => {
  // ...

  if (!result.cancelled) {
    setSelectedImage(result.uri);
    /* @info */ setShowAppOptions(true); /* @end */

  } else {
    // ...
  }
};
```

Then, update the borderless button by adding an `onPressHandler` prop with the following value:

```js
<Button label="Use this photo" isBorderLess onPressHandler={() => setShowOptions(true)} />
```

Don't forget to remove the `alert` on the `Button` component and update the `onPress` prop when rendering the borderless button in **Button.js**:

<!-- prettier-ignore -->
```js
function Button({ label, isBorderLess, onPressHandler }) {
  if (isBorderLess) {
    return (
      <View style={styles.buttonContainer}>
        /* @info */
        <Pressable style={styles.button} onPress={onPressHandler}>
        /* @end */
          <Text style={styles.buttonLabel}>{label}</Text>
        </Pressable>
      </View>
    );
  }

  // ...
}
```

Next, update the JSX of the `App` component to conditionally render the `Button` component based on the value of `showAppOptions`.

<!-- prettier-ignore -->
```js
export default function App() {
  // ...
  return (
    <View style={styles.container}>
      /* ... */ 
      /* @info */
      {showAppOptions ? (
        <View />
      ) : (
        <View style={styles.footerContainer}>
          <Button label="Choose a photo" onPressHandler={pickImageHandler} />
          <Button
            label="Use this photo"
            isBorderLess
            onPressHandler={() => setShowAppOptions(true)}
          />
        </View>
      )}
      /* @end */
      <StatusBar style="auto" />
    </View>
  );
}
```

For now, an empty `View` component is rendered when the value of `showAppOptions` is `true`. This value is handled in the next step.

## Step 2: Add buttons

Let's break down the layout of the option buttons you will implement in this section. It will look like the following:

<ImageSpotlight alt="Break down of the layout of the buttons row." src="/static/images/tutorial/buttons-layout.jpg" style={{ maxWidth: 400 }} containerStyle={{ marginBottom: 0 }} />

It contains a parent `View` with three buttons aligned in a row. The button in the middle with the plus icon (+) will open the model and styled differently than the other two buttons.

Inside the **components** directory, create a new file called **CircleButton.js** with the following code snippet:

```js
import { View, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function CircleButton({ onPressHandler }) {
  return (
    <View style={styles.circleButtonContainer}>
      <Pressable style={styles.circleButton} onPress={onPressHandler}>
        <MaterialIcons name="add" size={38} color="#25292e" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  circleButtonContainer: {
    width: 84,
    height: 84,
    marginHorizontal: 60,
    borderWidth: 4,
    borderColor: '#ffd33d',
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  circleButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    borderRadius: 42,
    backgroundColor: '#fff',
  },
});
```

It uses the `MaterialIcons` icon set from the `@expo/vector-icons` library to render the plus icon.

The other two buttons also use the same icon set to show a text label and an icon vertically aligned. Next, create a reusable function component file **IconButton.js** inside the components directory. This component accepts three props:

- `icon`: the icon's name corresponds to the icon in the `MaterialIcons` library.
- `label`: the text label to be displayed on the button.
- `onPressHandler`: the function to be called when the button is pressed.

```js
import { Pressable, StyleSheet, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function IconButton({ icon, label, onPressHandler }) {
  return (
    <Pressable style={styles.iconButton} onPress={onPressHandler}>
      <MaterialIcons name={icon} size={24} color="#fff" />
      <Text style={styles.iconButtonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonLabel: {
    color: '#fff',
    marginTop: 12,
  },
});
```

To display these buttons, import them in **App.js** and replace the empty `View` component from the previous step. Let's also create the handler methods for these buttons so that you can add the functionality later on.

<SnackInline
label="Add Button options"
templateId="tutorial/03-button-options/App"
dependencies={['expo-image-picker', '@expo/vector-icons/FontAwesome', '@expo/vector-icons', 'expo-status-bar', '@expo/vector-icons/MaterialIcons']}
files={{
  'assets/images/background-image.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/503001f14bb7b8fe48a4e318ad07e910',
  'components/ImageViewer.js': 'tutorial/02-image-picker/ImageViewer.js',
  'components/Button.js': 'tutorial/03-button-options/Button.js',
  'components/CircleButton.js': 'tutorial/03-button-options/CircleButton.js',
  'components/IconButton.js': 'tutorial/03-button-options/IconButton.js',
}}>

<!-- prettier-ignore -->
```js
// ... rest of the import statements

import CircleButton from './components/CircleButton';
import IconButton from './components/IconButton';

export default function App() {
  // ...
  const resetHandler = () => {
    setShowAppOptions(false);
  };

  const modalVisibilityHandler = () => {
    // we will implement this later
  };

  const saveImageHandler = () => {
    // we will implement this later
  };

   return (
    <View style={styles.container}>
      /* ... */
      {showAppOptions ? (        
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <IconButton
              icon="refresh"
              label="Reset"
              onPressHandler={resetHandler}
            />
            <CircleButton onPressHandler={modalVisibilityHandler} />
            <IconButton
              icon="save-alt"
              label="Save"
              onPressHandler={saveImageHandler}
            />
          </View>
        </View>
      ) : (
        /* ... */
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  // ...previous styles remain unchanged
  optionsContainer: {
    flex: 1 / 4,
  },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
})
```

</SnackInline>

In the above snippet, the `resetHandler()` method is called when the user presses the reset button. When this button is pressed, the user is shown the image picker button again.

On running the app, you will get similar results:

<ImageSpotlight alt="Button options displayed after a image is selected." src="/static/images/tutorial/button-options.jpg" style={{ maxWidth: 720 }} containerStyle={{ marginBottom: 0 }} />

## Step 3: Create an emoji picker modal

The modal allows the user to choose an emoji from the list of available emoji. Create an **EmojiPicker.js** file inside **components** directory. This component accepts three props:

- `modalVisible`: a boolean whose value determines whether the modal is visible or not. It's a state variable created in the `App` component to keep track of the modal's visibility.
- `onClose`: a handler function invoked when the user closes the modal.
- `children`: used later to display the emoji list.

<!-- prettier-ignore -->
```js
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function EmojiPicker({ modalVisible, children, onClose }) {
  return (
    <Modal animationType="slide" transparent={true} visible={modalVisible}>
      <View style={styles.modalContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Choose a sticker</Text>
          <Pressable onPress={onClose}>
            <MaterialIcons name="close" color="#fff" size={22} />
          </Pressable>
        </View>        
        {children}
      </View>
    </Modal>
  );
}
```

Let's learn what the above code does.

- The `Modal` component currently displays a title and a close button. The `visible` prop takes the value of the `modalVisible`. The `transparent` prop on the component is a boolean value that determines whether the modal fills the entire view.
- Since the emoji picker is displayed over 25% of the screen, there is no need to fill the entire view with a specific background color. So instead, the modal uses a transparent background.
- The `animationType` prop determines the component's animation for entering and leaving the screen. In this case, it is sliding from the bottom of the screen.
- Lastly, the `onClose` prop is the handler function called when the user presses the close button on the `Pressable` component.

The next step is to add the corresponding styles for the `EmojiPicker` component:

<!-- prettier-ignore -->
```js
const styles = StyleSheet.create({
  modalContent: {
    height: '25%',
    width: '100%',
    backgroundColor: '#25292e',
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    position: 'absolute',
    bottom: 0,
  },
  titleContainer: {
    height: '16%',
    backgroundColor: '#464C55',
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 50,
    paddingVertical: 20,
  },
});
```

Now, let's modify the **App.js** to:

- Import the `EmojiPicker` component.
- Then, create a `modalVisible` state variable using `useState` hook. It has a default value of `false` that determines that the modal is not visible by default.
- Update the `modalVisibilityHandler` to update the `modalVisible` state variable.
- Place the `EmojiPicker` component at the bottom of the JSX returned by `App` component.

<SnackInline
label="Create a modal"
templateId="tutorial/04-modal/App"
dependencies={['expo-image-picker', '@expo/vector-icons/FontAwesome', '@expo/vector-icons', 'expo-status-bar', '@expo/vector-icons/MaterialIcons']}
files={{
  'assets/images/background-image.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/503001f14bb7b8fe48a4e318ad07e910',
  'components/ImageViewer.js': 'tutorial/02-image-picker/ImageViewer.js',
  'components/Button.js': 'tutorial/03-button-options/Button.js',
  'components/CircleButton.js': 'tutorial/03-button-options/CircleButton.js',
  'components/IconButton.js': 'tutorial/03-button-options/IconButton.js',
  'components/EmojiPicker.js': 'tutorial/04-modal/EmojiPicker.js',
}}>

<!-- prettier-ignore -->
```js
import EmojiPicker from "./components/EmojiPicker";


export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  /* @hide const [showAppOptions, setShowAppOptions] = useState(false); */
  const [showAppOptions, setShowAppOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImageHandler = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setSelectedImage(result.uri);
      setShowAppOptions(true);
    } else {
      alert("You did not select any image.");
    }
  };

  const resetHandler = () => {
    setShowAppOptions(false);
  };

  const saveImageHandler = () => {
    // we will implement this later
  };
  /* @end */

  const modalVisibilityHandler = () => {
    setModalVisible((current) => !current);
  };

  return (
    <View style={styles.container}>
      /* previous code remains unchanged */      
      <EmojiPicker modalVisible={modalVisible} onClose={modalVisibilityHandler}>
        {/* A list of emoji component will go here */}
      </EmojiPicker>      
    </View>
  );
}
```

</SnackInline>

Here is the output after this step:

<ImageSpotlight alt="A modal working on all platforms" src="/static/images/tutorial/modal-creation.jpg" style={{ maxWidth: 720 }} containerStyle={{ marginBottom: 0 }} />

## Step 4: Display a list of emoji

Let's implement a list of emoji in the modal's content. The list component uses a [`FlatList` from React Native](https://reactnative.dev/docs/flatlist) to display a horizontal list of emoji.

Our designers have provided us with six emoji images to render them as a list. Download all of these assets from this [GitHub repo]() and then save the image files inside the **assets/images/** directory.

> If you are using the starter template, all assets are available in the **assets/** folder.

After you save them, create the **EmojiList.js** file in the **components** directory and add the following code snippet:

<!-- prettier-ignore -->
```js
import { useState } from 'react';
import { StyleSheet, FlatList, Image, Platform, Pressable } from 'react-native';

export default function EmojiList({ onSelect }) {
  const [emoji] = useState([
    require('../assets/images/emoji1.png'),
    require('../assets/images/emoji2.png'),
    require('../assets/images/emoji3.png'),
    require('../assets/images/emoji4.png'),
    require('../assets/images/emoji5.png'),
    require('../assets/images/emoji6.png'),
  ]);

  return (
    <FlatList
      horizontal
      /* @info Let's display the horizontal scroll indicator if the app is working on web*/
      showsHorizontalScrollIndicator={Platform.OS === 'web' ? true : false}
      /* @end */
      data={emoji}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item, index }) => {
        return (
          <Pressable
            onPress={() => {
              onSelect(item);
            }}>
            <Image source={item} key={index} style={styles.image} />
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  image: {
    width: 100,
    height: 100,
    marginRight: 20,
  },
});
```

The `FlatList` component in the above snippet renders all the emoji images using an `Image` component wrapped with a `Pressable`. This is because, later, we will implement the functionality where the user can tap an emoji on the screen to select and that selected emoji will appear as a sticker on the placeholder image.

The `FlatList` component takes an array of items which in the above snippet is provided by the `emoji` array variable as the value of the `data` prop. Then, the `renderItem` takes the item from the `data` and returns the item in the list. You can write your own JSX to however you want to display this item, which is done using the `Image` and the `Pressable` components.

The `horizontal` prop allows the list to display horizontally instead of vertically (the default way to display a list of items in the `FlatList`).

Now, modify the `App` component. Import the `EmojiList` component and replace the comments where the `EmojiPicker` component is used with the following code snippet:

<!-- prettier-ignore -->
```js
//... after other import statements
import EmojiList from './components/EmojiList';

// Inside App component to select the emoji from the list

export default function App() {
  // after other state variables, define
  const [pickedEmoji, setPickedEmoji] = useState(null);

  // then modify the JSX
  return (
    <View style={styles.container}>
      /* rest of the code remains unchanged */
      <EmojiPicker modalVisible={modalVisible} onClose={modalVisibilityHandler}>
        <EmojiList onSelect={setPickedEmoji} />
      </EmojiPicker>
    </View>
  );
  )
}
```

On running the app, you will get a similar output on all platforms:

<ImageSpotlight alt="List of emojis shown using the FlatList component." src="/static/images/tutorial/emoji-list.jpg" style={{ maxWidth: 720 }} containerStyle={{ marginBottom: 0 }} />

## Step 5: Display the selected emoji

Add the code snippet to the **App.js** to display the selected emoji on the background or placeholder image.

Start by creating a new component file: **components/EmojiSticker.js** and add the following code snippet. This component receives two props:

- `imageSize`: a constant value defined inside the `App` component. We will use this value in the next module to scale the image size on a tap gesture.
- `stickerSource`: the source of the selected emoji image.

```js
import { View, Image } from 'react-native';

export default function EmojiSticker({ imageSize, stickerSource }) {
  return (
    <View style={{ top: -450 }}>
      <Image
        source={stickerSource}
        resizeMode="contain"
        style={{ width: imageSize, height: imageSize }}
      />
    </View>
  );
}
```

Now, import this component in **App.js**, and define a variable `SIZE` that determines the initial width and height of the emoji image.

```js
// rest of the import statements
import EmojiSticker from './components/EmojiSticker';

// define the initial size of the emoji image
const SIZE = 40;
```

Then, update the `App` component to display the emoji on the placeholder image conditionally. This is done by checking if the `pickedEmoji` state variable is not null. If it is not null, this variable refers to the source of the emoji image.

<SnackInline
label="Display selected emoji sticker"
templateId="tutorial/05-emoji-list/App"
dependencies={['expo-image-picker', '@expo/vector-icons/FontAwesome', '@expo/vector-icons', 'expo-status-bar', '@expo/vector-icons/MaterialIcons']}
files={{
  'assets/images/background-image.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/503001f14bb7b8fe48a4e318ad07e910',
  'assets/images/emoji1.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/be9751678c0b3f9c6bf55f60de815d30',
  'assets/images/emoji2.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/7c0d14b79e134d528c5e0801699d6ccf',
  'assets/images/emoji3.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/d713e2de164764c2ab3db0ab4e40c577',
  'assets/images/emoji4.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/ac2163b98a973cb50bfb716cc4438f9a',
  'assets/images/emoji5.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/9cc0e2ff664bae3af766b9750331c3ad',
  'assets/images/emoji6.png': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/ce614cf0928157b3f7daa3cb8e7bd486',
  'components/ImageViewer.js': 'tutorial/02-image-picker/ImageViewer.js',
  'components/Button.js': 'tutorial/03-button-options/Button.js',
  'components/CircleButton.js': 'tutorial/03-button-options/CircleButton.js',
  'components/IconButton.js': 'tutorial/03-button-options/IconButton.js',
  'components/EmojiPicker.js': 'tutorial/04-modal/EmojiPicker.js',
  'components/EmojiList.js': 'tutorial/05-emoji-list/EmojiList.js',
  'components/EmojiSticker.js': 'tutorial/05-emoji-list/EmojiSticker.js',
}}>

<!-- prettier-ignore -->
```js
export default function App() {
  // rest of the code

  return (
    <View>
      /* rest of the code */
      {pickedEmoji !== null ? <EmojiSticker imageSize={SIZE} stickerSource={pickedEmoji} /> : null}
      /* rest of the code */
    </View>
  );
}
```

</SnackInline>

On running the app, you will get a similar output on all platforms:

<Video file="tutorial/select-emoji.mp4" />

## Up next

You have successfully created the emoji picker modal and implemented the business logic to select an emoji and display it over the placeholder image.

In the next step, let's add [user interactions using gestures](/tutorial/gestures) to drag the emoji and scale the size by tapping it.
