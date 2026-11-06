import { generateAsync } from 'expo-ai';
import { Asset } from 'expo-asset';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import { AIResultPanel, describeGeneration, styles, ThemedTextInput, useAIAction } from './shared';

const PHOTO = require('../../../assets/images/example2.jpg');

async function resolvePhotoUri() {
  const { localUri } = await Asset.fromModule(PHOTO).downloadAsync();
  if (!localUri) {
    throw new Error('The photo asset has no local file. Restart the app and try again.');
  }
  return localUri;
}

export default function ImagesScreen() {
  const { outcome, pending, run, buttonProps } = useAIAction();
  const [prompt, setPrompt] = useState('Describe this image.');

  const generate = () =>
    run('images', async () => {
      const uri = await resolvePhotoUri();
      return describeGeneration(await generateAsync(prompt, { images: [{ uri, label: 'photo' }] }));
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <BodyText color="secondary" style={styles.description}>
        generateAsync sends the photo below with the prompt as a local file labeled "photo".
      </BodyText>

      <Image source={PHOTO} style={imageStyles.photo} resizeMode="cover" />

      <ThemedTextInput
        style={styles.promptInput}
        placeholder="Prompt"
        multiline
        value={prompt}
        onChangeText={setPrompt}
      />

      <Button {...buttonProps('images', !prompt.trim())} onPress={generate} title="Generate" />

      <AIResultPanel outcome={outcome} dimmed={pending !== null} />
    </ScrollView>
  );
}

const imageStyles = StyleSheet.create({
  photo: {
    width: '100%',
    aspectRatio: 800 / 533,
    borderRadius: 8,
    marginBottom: 12,
  },
});
