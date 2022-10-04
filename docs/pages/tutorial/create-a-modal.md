---
title: Create a modal
---

import SnackInline from '~/components/plugins/SnackInline';
import ImageSpotlight from '~/components/plugins/ImageSpotlight';
import Video from '~/components/plugins/Video';
import { LinkBase } from '~/ui/components/Text';

React Native provides a <LinkBase href="https://reactnative.dev/docs/modal" openInNewTab>`<Modal>`</LinkBase> component that presents content above an underlying view. In general, modals are used to draw a user's attention toward critical information or guide them to take action.

In this chapter, we’ll create a modal that shows an emoji picker list.

## Step 1: Declare a state variable to show buttons

Before implementing the modal, we have to add three new buttons. These buttons are only visible when the user picks an image from the media library or decides to use the placeholder image. One of these buttons will trigger the sticker modal.

Declare a state variable called `showAppOptions` in **App.js**. We’ll use this variable to show or hide buttons that open the modal alongside a few other options.

The value of this variable is a boolean. When the app screen loads, we’ll set it to `false` so that the options are not shown before picking an image.

```js
export default function App() {
  const [showAppOptions, setShowAppOptions] = useState(false);
  // ...
}
```

The value of this variable will be set to true when the user picks an image from the media library or decides to use the placeholder image.

Next, modify the `pickImageAsync()` function to set the value of `showAppOptions` to `true` after the user picks an image.

<!-- prettier-ignore -->
```js
const pickImageAsync = async () => {
  // ...

  if (!result.cancelled) {
    setSelectedImage(result.uri);
    /* @info */ setShowAppOptions(true); /* @end */

  } else {
    // ...
  }
};
```

Then, update the button with no theme by adding an `onPress` prop with the following value:

```js
<Button label="Use this photo" onPress={() => setShowOptions(true)} />
```

Don't forget to remove the `alert` on the `<Button>` component and update the `onPress` prop when rendering the second button in **Button.js**:

<!-- prettier-ignore -->
```jsx    
<Pressable style={styles.button} onPress={onPress}>
```

Next, update the JSX in **App.js** to conditionally render the `<Button>` component based on the value of `showAppOptions`.

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
          <Button theme="primary" label="Choose a photo" onPress={pickImageAsync} />
          <Button label="Use this photo" onPress={() => setShowAppOptions(true)} />
        </View>
      )}
      /* @end */
      <StatusBar style="auto" />
    </View>
  );
}
```

For now, an empty `<View>` component is rendered when the value of `showAppOptions` is `true`. We’ll address this state in the next step.

## Step 2: Add buttons

Let's break down the layout of the option buttons we will implement in this chapter. The design looks like this:

<ImageSpotlight alt="Break down of the layout of the buttons row." src="/static/images/tutorial/buttons-layout.jpg" style={{ maxWidth: 400 }} containerStyle={{ marginBottom: 10 }} />

It contains a parent `<View>` with three buttons aligned in a row. The button in the middle with the plus icon (+) will open the model and is styled differently than the other two buttons.

Inside the **components** directory, create a new file called **CircleButton.js** with the following code snippet:

```js
import { View, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function CircleButton({ onPress }) {
  return (
    <View style={styles.circleButtonContainer}>
      <Pressable style={styles.circleButton} onPress={onPress}>
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

It uses the `<MaterialIcons>` icon set from the `@expo/vector-icons` library to render the plus icon.

The other two buttons also use `<MaterialIcons>` to show a text label and an icon vertically aligned. Next, create a file named **IconButton.js** inside the **components** directory. This component accepts three props:

- `icon`: the name that corresponds to the icon in the `MaterialIcons` library.
- `label`: the text label displayed on the button.
- `onPress`: the function called when the button is pressed.

```js
import { Pressable, StyleSheet, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function IconButton({ icon, label, onPress }) {
  return (
    <Pressable style={styles.iconButton} onPress={onPress}>
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

To display these buttons, import them in **App.js** and replace the empty `<View>` component from the previous step. Let's also create the `onPress` functions for these buttons so that we can add the functionality later on.

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
  const onReset = () => {
    setShowAppOptions(false);
  };

  const onAddSticker = () => {
    // we will implement this later
  };

  const onSaveImageAsync = async () => {
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
              onPress={onReset}
            />
            <CircleButton onPress={onAddSticker} />
            <IconButton
              icon="save-alt"
              label="Save"
              onPress={onSaveImageAsync}
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
    position: "absolute",
    bottom: 80,
  },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
})
```

</SnackInline>

In the above snippet, the `onReset()` function is called when the user presses the reset button. When this button is pressed, we’ll show the image picker button again.

Let's take a look at our app now on Android, iOS, and the web:

<ImageSpotlight alt="Button options displayed after a image is selected." src="/static/images/tutorial/button-options.jpg" style={{ maxWidth: 720 }} containerStyle={{ marginBottom: 0 }} />

## Step 3: Create an emoji picker modal

The modal allows the user to choose an emoji from a list of available emoji. Create an **EmojiPicker.js** file inside **components** directory. This component accepts three props:

- `isVisible`: a boolean that determines whether the modal is visible or not.
- `onClose`: a function that closes the modal.
- `children`: used later to display a list of emoji.

<!-- prettier-ignore -->
```js
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function EmojiPicker({ isVisible, children, onClose }) {
  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
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

- The `<Modal>` component displays a title and a close button.
- Its `visible` prop takes the value of `isVisible` and controls if the modal is open or closed.
- Its `transparent` prop is a boolean value that determines whether the modal fills the entire view.
- Its `animationType` prop determines how it enters and leaves the screen. In this case, it is sliding from the bottom of the screen.
- Lastly, its `onClose` prop is called when the user presses the close button on the `<Pressable>` component.

The next step is to add the corresponding styles for the `<EmojiPicker>` component:

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

- Import the `<EmojiPicker>` component.
- Then, create a `isModalVisible` state variable using `useState` hook. It has a default value of `false` that determines that the modal is not visible by default.
- Create a`onModalClose()` function to update the `isModalVisible` state variable.
- Place the `<EmojiPicker>` component at the bottom of the JSX returned by `<App>` component.

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
  const [isModalVisible, setIsModalVisible] = useState(false);
  /* @hide const [showAppOptions, setShowAppOptions] = useState(false); */
  const [showAppOptions, setShowAppOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImageAsync = async () => {
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

  const onReset = () => {
    setShowAppOptions(false);
  };

  const onSaveImageAsync = async () => {
    // we will implement this later
  };
  /* @end */

  
  const onAddSticker = () => {
    setIsModalVisible(true);
  };

  const onModalClose = () => {
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      /* previous code remains unchanged */      
      <EmojiPicker isVisible={isModalVisible} onClose={onModalClose}>
        {/* A list of emoji component will go here */}
      </EmojiPicker>      
    </View>
  );
}
```

</SnackInline>

Here is the result after this step:

<ImageSpotlight alt="A modal working on all platforms" src="/static/images/tutorial/modal-creation.jpg" style={{ maxWidth: 720 }} containerStyle={{ marginBottom: 0 }} />

## Step 4: Display a list of emoji

Let's implement a list of emoji in the modal's content. The component we’ll use is the <LinkBase href="https://reactnative.dev/docs/flatlist" openInNewTab>`<FlatList>`</LinkBase> component from React Native, which will display a horizontal list of emoji.

Create a file named **EmojiList.js** file in the **components** directory and add the following code:

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

The `<FlatList>` component above renders all the emoji images using an `<Image>` component wrapped with a `<Pressable>` component. Later, we will improve it so that the user can tap an emoji on the screen to make it appear as a sticker on the image.

The `<FlatList>` component takes an array of items, which in the above snippet is provided by the `emoji` array variable as the value of the `data` prop. Then, the `renderItem` prop takes the item from `data` and returns the item in the list. We add our own JSX to display this item, which is done using the `<Image>` and the `<Pressable>` components.

The `horizontal` prop allows the list to display horizontally instead of vertically.

Now, modify the `App` component. Import the `<EmojiList>` component and replace the comments where the `<EmojiPicker>` component is used with the following code snippet:

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
      <EmojiPicker isVisible={isModalVisible} onClose={onModalClose}>
        <EmojiList onSelect={setPickedEmoji} />
      </EmojiPicker>
    </View>
  );
  )
}
```

Let's take a look at our app now on Android, iOS, and the web:

<ImageSpotlight alt="List of emojis shown using the FlatList component." src="/static/images/tutorial/emoji-list.jpg" style={{ maxWidth: 720 }} containerStyle={{ marginBottom: 0 }} />

## Step 5: Display the selected emoji

Now we’ll put the emoji sticker on the image.

Start by creating a new file in **components** named **EmojiSticker.js** and add the following code snippet.

```js
import { View, Image } from 'react-native';

export default function EmojiSticker({ imageSize, stickerSource }) {
  return (
    <View style={{ top: -350 }}>
      <Image
        source={stickerSource}
        resizeMode="contain"
        style={{ width: imageSize, height: imageSize }}
      />
    </View>
  );
}
```

This component receives two props:

- `imageSize`: a value defined inside the `<App>` component. We will use this value in the next chapter to scale the image’s size when tapped.
- `stickerSource`: the source of the selected emoji image.

We’ll import this component in **App.js**:

```js
// rest of the import statements
import EmojiSticker from './components/EmojiSticker';
```

We’ll also update the `<App>` component to display the emoji sticker on the image conditionally. We’ll do this by checking if the `pickedEmoji` state is not `null`.

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
     <View style={styles.imageContainer}>
        <ImageViewer placeholderImageSource={PlaceholderImage} selectedImage={selectedImage} />
        {pickedEmoji !== null ? <EmojiSticker imageSize={40} stickerSource={pickedEmoji} /> : null}
      </View>  
      /* rest of the code */
    </View>
  );
}
```

</SnackInline>

Let's take a look at our app:

<!-- RE-RECORD EMOJI because pickedEmoji nested under imageContainer -->
<Video file="tutorial/select-emoji.mp4" />

## Up next

We successfully created the emoji picker modal and implemented the logic to select an emoji and display it over the image.

In the next chapter, let's add [user interactions with gestures](/tutorial/gestures) to drag the emoji and scale the size by tapping it.
