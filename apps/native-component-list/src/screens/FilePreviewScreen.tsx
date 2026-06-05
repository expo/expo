import { Asset } from 'expo-asset';
import * as FilePreview from 'expo-file-preview';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { BodyText } from '../components/BodyText';
import Button from '../components/Button';
import MonoText from '../components/MonoText';
import { ScrollPage, Section } from '../components/Page';

type PreviewFixture = {
  title: string;
  fileName: string;
  mimeType: string;
  prepareFileAsync: () => Promise<File>;
};

const getPreviewDirectory = () => {
  const directory = new Directory(Paths.cache, 'file-preview');
  directory.create({ intermediates: true, idempotent: true });
  return directory;
};

const writeFileAsync = async (fileName: string, contents: string) => {
  const file = new File(getPreviewDirectory(), fileName);
  await file.write(contents);
  return file;
};

const copyAssetAsync = async (assetModule: number, fileName: string) => {
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();

  if (!asset.localUri) {
    throw new Error('Unable to resolve local asset URI.');
  }

  const source = new File(asset.localUri);
  const destination = new File(getPreviewDirectory(), fileName);
  await source.copy(destination, { overwrite: true });
  return destination;
};

const previewFixtures: PreviewFixture[] = [
  {
    title: 'PDF',
    fileName: 'native-preview-test.pdf',
    mimeType: 'application/pdf',
    prepareFileAsync: () =>
      writeFileAsync(
        'native-preview-test.pdf',
        `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 58 >>
stream
BT /F1 24 Tf 72 720 Td (Native File Preview PDF) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000251 00000 n
0000000359 00000 n
trailer
<< /Root 1 0 R /Size 6 >>
startxref
429
%%EOF`
      ),
  },
  {
    title: 'JPEG image',
    fileName: 'native-preview-test.jpg',
    mimeType: 'image/jpeg',
    prepareFileAsync: () =>
      copyAssetAsync(require('../../assets/images/large-example.jpg'), 'native-preview-test.jpg'),
  },
  {
    title: 'Plain text',
    fileName: 'native-preview-test.txt',
    mimeType: 'text/plain',
    prepareFileAsync: () =>
      writeFileAsync(
        'native-preview-test.txt',
        'Native File Preview text fixture.\n\nThis file was generated locally in the Expo test app.'
      ),
  },
];

export default function FilePreviewScreen() {
  const [loadingKey, setLoadingKey] = React.useState<string | null>(null);
  const [lastResult, setLastResult] = React.useState<string | null>(null);

  const openFixture = async (fixture: PreviewFixture) => {
    setLoadingKey(`${fixture.fileName}:preview`);
    setLastResult(null);
    let canPreview: boolean | null = null;

    try {
      const file = await fixture.prepareFileAsync();
      canPreview = await FilePreview.canPreviewAsync(file.uri, {
        mimeType: fixture.mimeType,
      });
      setLastResult(`${fixture.title}: canPreview=${canPreview}`);
      await FilePreview.openPreviewAsync(file.uri, {
        title: fixture.title,
        mimeType: fixture.mimeType,
      });

      setLastResult(`${fixture.title}: canPreview=${canPreview}, opened preview`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const previewState = canPreview == null ? '' : ` (canPreview=${canPreview})`;
      setLastResult(`${fixture.title}: failed to open preview${previewState}`);
      Alert.alert('File preview failed', message);
    } finally {
      setLoadingKey(null);
    }
  };

  const shareFixture = async (fixture: PreviewFixture) => {
    setLoadingKey(`${fixture.fileName}:share`);
    setLastResult(null);

    try {
      const file = await fixture.prepareFileAsync();
      await Sharing.shareAsync(file.uri, {
        mimeType: fixture.mimeType,
        dialogTitle: fixture.title,
      });
      setLastResult(`${fixture.title}: opened share sheet`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastResult(`${fixture.title}: ${message}`);
      Alert.alert('Sharing failed', message);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <ScrollPage>
      <Section title="Files" gap={8}>
        {previewFixtures.map((fixture) => (
          <View key={fixture.fileName} style={styles.row}>
            <View style={styles.fileInfo}>
              <BodyText>{fixture.title}</BodyText>
              <BodyText>{fixture.mimeType}</BodyText>
            </View>
            <Button
              title="Open"
              loading={loadingKey === `${fixture.fileName}:preview`}
              disabled={loadingKey != null}
              onPress={() => openFixture(fixture)}
            />
            <Button
              title="Share"
              loading={loadingKey === `${fixture.fileName}:share`}
              disabled={loadingKey != null}
              onPress={() => shareFixture(fixture)}
            />
          </View>
        ))}
      </Section>

      {lastResult ? (
        <Section title="Last result">
          <MonoText>{lastResult}</MonoText>
        </Section>
      ) : null}
    </ScrollPage>
  );
}

FilePreviewScreen.navigationOptions = {
  title: 'FilePreview',
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  fileInfo: {
    flex: 1,
  },
});
