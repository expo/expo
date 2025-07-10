import { Image } from 'expo-image';
import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Text, Button, ActivityIndicator } from 'react-native';

export default function ImageBlurhash() {
  const uri = 'https://picsum.photos/seed/175/300/200';

  const [blurhashRef, setBlurhashRef] = useState<string | null>(null);
  const [isLoadingRef, setIsLoadingRef] = useState<boolean>(false);
  const [errorRef, setErrorRef] = useState<string | null>(null);

  const [blurhashUri, setBlurhashUri] = useState<string | null>(null);
  const [isLoadingUri, setIsLoadingUri] = useState<boolean>(false);
  const [errorUri, setErrorUri] = useState<string | null>(null);

  const [isGenerateClicked, setIsGenerateClicked] = useState<boolean>(false);

  const generateBlurhash = useCallback(
    async (
      setLoading: React.Dispatch<React.SetStateAction<boolean>>,
      setError: React.Dispatch<React.SetStateAction<string | null>>,
      setBlurhash: React.Dispatch<React.SetStateAction<string | null>>,
      useLoadAsync: boolean
    ) => {
      setLoading(true);
      setError(null);
      let generatedBlurhash: string | null = null;
      try {
        let imageSource: any = uri;
        if (useLoadAsync) {
          imageSource = await Image.loadAsync({ uri });
        }
        generatedBlurhash = await Image.generateBlurhashAsync(imageSource, [6, 6]);
        if (!generatedBlurhash) {
          throw new Error(
            `Generated blurhash from ${useLoadAsync ? 'SharedRef' : 'URI'} is empty or null.`
          );
        }
      } catch (error: any) {
        setError(
          `Failed to generate from ${useLoadAsync ? 'SharedRef' : 'URI'}: ${error.message || 'Unknown error'}`
        );
      } finally {
        setBlurhash(generatedBlurhash);
        setLoading(false);
      }
    },
    [uri]
  );

  const handleGeneratePress = useCallback(() => {
    setIsGenerateClicked(true);
    setBlurhashRef(null);
    setBlurhashUri(null);
    setErrorRef(null);
    setErrorUri(null);
    generateBlurhash(setIsLoadingRef, setErrorRef, setBlurhashRef, true);
    generateBlurhash(setIsLoadingUri, setErrorUri, setBlurhashUri, false);
  }, [generateBlurhash]);

  const renderBlurhashResult = (
    title: string,
    blurhashString: string | null,
    loading: boolean,
    error: string | null
  ) => {
    if (!isGenerateClicked) return null;

    if (loading) {
      return (
        <View style={styles.imageContainer}>
          <Text style={styles.header}>{title}:</Text>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.imageContainer}>
          <Text style={styles.header}>{title}:</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Text style={styles.header}>{title}:</Text>
        {blurhashString ? (
          <View style={styles.imageContainer}>
            <Image source={{ blurhash: blurhashString }} style={styles.image} />
            <Text style={styles.blurhashText}>{blurhashString}</Text>
          </View>
        ) : (
          <Text style={styles.errorText}>No blurhash generated.</Text>
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
        <Button title="Generate Blurhash" onPress={handleGeneratePress} />
      </View>

      <View>
        {renderBlurhashResult('Blurhash from URI', blurhashUri, isLoadingUri, errorUri)}
        {renderBlurhashResult('Blurhash from SharedRef', blurhashRef, isLoadingRef, errorRef)}
      </View>
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
