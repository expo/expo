import { ImageContentFit, ImageContentPosition, Image } from 'expo-image';
import React from 'react';
import {
  Dimensions,
  Image as RNImage,
  ImageResizeMode,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FunctionParameter, useArguments } from '../../components/FunctionDemo';
import Configurator from '../../components/FunctionDemo/Configurator';
import { Colors } from '../../constants';
import { ResizableView } from './ImageResizableScreen';


const parameters: FunctionParameter[] = [
  {
    name: 'Use React Native Image',
    type: 'boolean',
    initial: false,
  },
];



const sources = [200, 400, 600, 800, 1000].map((size) => ({
  uri: `https://picsum.photos/seed/${size}/${size}`,
  width: size,
  height: size
}));

export default function ImageSourcesScreen() {
  const [args, updateArgument] = useArguments(parameters);
  const [showReactNativeComponent] = args as [boolean];
  const ImageComponent: React.ElementType = showReactNativeComponent ? RNImage : Image;
  
  return (
    <ScrollView style={styles.container}>
      <ResizableView>
        <ImageComponent style={styles.image} source={sources} />
      </ResizableView>

      <View style={styles.configurator}>
        <Configurator parameters={parameters} onChange={updateArgument} value={args} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  configurator: {
    flex: 1,
    paddingHorizontal: 15,
  },
  image: {
    flex: 1,
  },
});
