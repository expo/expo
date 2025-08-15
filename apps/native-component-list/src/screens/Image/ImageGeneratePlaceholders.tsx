import { Image, ImageRef } from 'expo-image';
import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Text, Button, ActivityIndicator } from 'react-native';

const uri = 'https://picsum.photos/seed/175/300/200';

enum PlaceholderType {
  Blurhash,
  Thumbhash,
}
enum SourceType {
  Uri,
  SharedRef,
}

interface PlaceholderState {
  type: PlaceholderType;
  source: SourceType;
  value: string | null;
  loading: boolean;
  error: string | null;
}

const initialStates: PlaceholderState[] = [
  {
    type: PlaceholderType.Blurhash,
    source: SourceType.Uri,
    value: null,
    loading: false,
    error: null,
  },
  {
    type: PlaceholderType.Blurhash,
    source: SourceType.SharedRef,
    value: null,
    loading: false,
    error: null,
  },
  {
    type: PlaceholderType.Thumbhash,
    source: SourceType.Uri,
    value: null,
    loading: false,
    error: null,
  },
  {
    type: PlaceholderType.Thumbhash,
    source: SourceType.SharedRef,
    value: null,
    loading: false,
    error: null,
  },
];

export default function ImageGeneratePlaceholders() {
  const [placeholderStates, setPlaceholder] = useState<PlaceholderState[]>(initialStates);
  const [isGenerateClicked, setIsGenerateClicked] = useState(false);

  const updatePlaceholderState = useCallback(
    (type: PlaceholderType, source: SourceType, updates: Partial<PlaceholderState>) => {
      setPlaceholder((prev) =>
        prev.map((state) =>
          state.type === type && state.source === source ? { ...state, ...updates } : state
        )
      );
    },
    []
  );

  const handleGenerationOfPlaceholder = useCallback(
    async (placeholderType: PlaceholderType, sourceType: SourceType) => {
      updatePlaceholderState(placeholderType, sourceType, {
        loading: true,
        error: null,
        value: null,
      });

      try {
        const imageSource = await getImageSource(sourceType);
        const placeholder = await generatePlaceholder(imageSource, placeholderType);
        if (!placeholder) {
          throw new Error('Generated placeholder is empty.');
        }
        updatePlaceholderState(placeholderType, sourceType, { value: placeholder });
      } catch (error: any) {
        updatePlaceholderState(placeholderType, sourceType, {
          error: `Failed to generate ${placeholderType} from ${sourceType}: ${error.message}`,
        });
      } finally {
        updatePlaceholderState(placeholderType, sourceType, { loading: false });
      }
    },
    [updatePlaceholderState]
  );

  const getImageSource = useCallback(
    async (sourceType: SourceType): Promise<string | ImageRef> => {
      switch (sourceType) {
        case SourceType.Uri:
          return uri;
        case SourceType.SharedRef:
          return Image.loadAsync({ uri });
      }
    },
    [uri]
  );

  const generatePlaceholder = useCallback(
    async (
      imageSource: string | ImageRef,
      placeholderType: PlaceholderType
    ): Promise<string | null> => {
      switch (placeholderType) {
        case PlaceholderType.Blurhash:
          return Image.generateBlurhashAsync(imageSource, [6, 6]);
        case PlaceholderType.Thumbhash:
          return Image.generateThumbhashAsync(imageSource);
      }
    },
    [uri]
  );

  const handleGeneratePress = useCallback(() => {
    setIsGenerateClicked(true);
    setPlaceholder(initialStates);
    initialStates.forEach(({ type, source }) => handleGenerationOfPlaceholder(type, source));
  }, [handleGenerationOfPlaceholder]);

  const renderResult = (placeholderState: PlaceholderState) => {
    if (!isGenerateClicked) {
      return null;
    }
    const title = `${placeholderState.type === PlaceholderType.Blurhash ? 'Blurhash' : 'Thumbhash'} from ${placeholderState.source === SourceType.Uri ? 'URI' : 'SharedRef'}`;

    return (
      <View
        key={`${placeholderState.type}-${placeholderState.source}`}
        style={styles.imageContainer}>
        <Text style={styles.header}>{title}:</Text>
        {placeholderState.loading ? (
          <ActivityIndicator size="small" color="#0000ff" />
        ) : placeholderState.error ? (
          <Text style={styles.errorText}>{placeholderState.error}</Text>
        ) : placeholderState.value ? (
          <>
            <Image
              source={
                placeholderState.type === PlaceholderType.Blurhash
                  ? { blurhash: placeholderState.value }
                  : { thumbhash: placeholderState.value }
              }
              style={styles.image}
            />
            <Text style={styles.blurhashText}>
              {placeholderState.value.length > 40
                ? `${placeholderState.value.slice(0, 40)}...`
                : placeholderState.value}
            </Text>
          </>
        ) : (
          <Text style={styles.errorText}>No {placeholderState.type} generated.</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Text style={styles.header}>Original Image:</Text>
        <Image source={{ uri }} style={styles.image} />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Generate" onPress={handleGeneratePress} />
      </View>

      <View>{placeholderStates.map(renderResult)}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f2f5',
  },
  imageContainer: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  buttonContainer: {
    marginBottom: 10,
  },
  image: {
    height: 150,
    width: 200,
    resizeMode: 'cover',
  },
  header: {
    fontWeight: '700',
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  blurhashText: {
    fontSize: 10,
    marginTop: 6,
    color: '#555',
    flexWrap: 'wrap',
  },
  errorText: {
    fontSize: 14,
    color: '#d9534f',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
