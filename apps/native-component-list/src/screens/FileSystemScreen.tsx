import Checkbox from 'expo-checkbox';
import * as Contacts from 'expo-contacts';
import { File, Directory, Paths, FileMode, zip, unzip, CompressionLevel } from 'expo-file-system';
import type { DownloadProgress, FileHandle } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  View,
  DimensionValue,
} from 'react-native';

import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';
import SimpleActionDemo from '../components/SimpleActionDemo';

FileSystemScreen.navigationOptions = {
  title: 'FileSystem',
};

function truncate(str: string, maxLen = 200): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + `... (${str.length} chars total)`;
}
function formatBytes(bytes: number): string {
  if (bytes < 0) return 'unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function FileSystemScreen() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [safDirectory, setSafDirectory] = useState<Directory | null>(null);

  function withCurrentFile(fn: (file: File) => Promise<any>) {
    return async () => {
      if (!currentFile) {
        throw new Error('No file selected. Pick or create a file first.');
      }
      return fn(currentFile);
    };
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        {currentFile && (
          <View style={styles.currentFileBar}>
            <Text style={styles.currentFileText}>Current: {truncate(currentFile.uri, 80)}</Text>
          </View>
        )}

        <FileSourcesSection setCurrentFile={setCurrentFile} />
        <FileInfoSection withCurrentFile={withCurrentFile} />
        <ReadWriteSection withCurrentFile={withCurrentFile} />
        <FileHandleSection currentFile={currentFile} />
        <CopyMoveSection
          withCurrentFile={withCurrentFile}
          safDirectory={safDirectory}
          setSafDirectory={setSafDirectory}
        />
        <DirectoryOperationsSection
          safDirectory={safDirectory}
          setSafDirectory={setSafDirectory}
          setCurrentFile={setCurrentFile}
        />
        {Platform.OS === 'android' && (
          <AndroidIntentsSection currentFile={currentFile} withCurrentFile={withCurrentFile} />
        )}
        <FileLifecycleSection setCurrentFile={setCurrentFile} withCurrentFile={withCurrentFile} />
        <FilePickerSection setCurrentFile={setCurrentFile} />
        <ZipSection
          currentFile={currentFile}
          safDirectory={safDirectory}
          withCurrentFile={withCurrentFile}
        />
        <DownloadSection />
      </View>
    </ScrollView>
  );
}

// ===== Section: File Sources =====

function FileSourcesSection({ setCurrentFile }: { setCurrentFile: (f: File) => void }) {
  return (
    <>
      <HeadingText>File Sources</HeadingText>
      <Text style={styles.note}>Pick or create a file to use in sections below</Text>

      <ListButton
        title="Create local file"
        onPress={() => {
          const file = new File(Paths.cache, 'test_sandbox', 'test.txt');
          file.create({ intermediates: true, overwrite: true });
          file.write('Hello from FileSystem sandbox! Timestamp: ' + Date.now());
          setCurrentFile(file);
          Alert.alert('Created', file.uri);
        }}
      />
      <ListButton
        title="Load asset file"
        onPress={() => {
          const file = new File(Paths.bundle, 'expo-root.pem');
          setCurrentFile(file);
          Alert.alert('Loaded asset', file.uri);
        }}
      />
      <ListButton
        title="File.pickFileAsync"
        onPress={async () => {
          const result = (await File.pickFileAsync({ multipleFiles: false })).result;
          const file = Array.isArray(result) ? result[0] : result;
          setCurrentFile(file as File);
          Alert.alert('Picked SAF file', file.uri);
        }}
      />
      <ListButton
        title="Pick from MediaLibrary"
        onPress={async () => {
          try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission denied');
              return;
            }
            const assets = await MediaLibrary.getAssetsAsync({
              first: 1,
              mediaType: 'photo',
            });
            if (assets.assets.length === 0) {
              Alert.alert('No assets found');
              return;
            }
            const assetInfo = await MediaLibrary.getAssetInfoAsync(assets.assets[0]);
            const file = new File(assetInfo.localUri ?? assetInfo.uri);
            setCurrentFile(file);
            Alert.alert('MediaLibrary file', file.uri);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
      <ListButton
        title="Pick from Contacts"
        onPress={async () => {
          try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission denied');
              return;
            }
            const { data: contacts } = await Contacts.getContactsAsync({
              fields: ['imageAvailable', 'image'],
              pageSize: 100,
            });
            if (contacts.length === 0) {
              Alert.alert('No contacts found');
              return;
            }
            const contactImageURI = contacts.find((contact) => contact.imageAvailable)?.image?.uri;
            if (!contactImageURI) {
              Alert.alert('No contact with profile image found');
              return;
            }
            const file = new File(contactImageURI);
            setCurrentFile(file);
            Alert.alert('Contact image', file.uri);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
      <ListButton
        title="Download from URL"
        onPress={async () => {
          try {
            const dest = new Directory(Paths.cache, 'test_sandbox');
            dest.create({ intermediates: true, idempotent: true });
            const file = await File.downloadFileAsync('https://httpbin.org/robots.txt', dest, {
              idempotent: true,
            });
            setCurrentFile(file as File);
            Alert.alert('Downloaded', file.uri);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
    </>
  );
}

// ===== Section: File Info & Properties =====

type WithCurrentFile = (fn: (file: File) => Promise<any>) => () => Promise<any>;

function FileInfoSection({ withCurrentFile }: { withCurrentFile: WithCurrentFile }) {
  return (
    <>
      <HeadingText>File Info & Properties</HeadingText>
      <SimpleActionDemo
        title="Show file properties"
        action={withCurrentFile(async (file) => ({
          uri: file.uri,
          name: file.name,
          extension: file.extension,
          exists: file.exists,
          size: file.size,
          type: file.type,
          md5: file.md5,
          modificationTime: file.modificationTime,
          creationTime: file.creationTime,
        }))}
      />
      {Platform.OS === 'android' && (
        <SimpleActionDemo
          title="Show contentUri (Android)"
          action={withCurrentFile(async (file) => ({
            original: file.uri,
            contentUri: file.contentUri,
          }))}
        />
      )}
      <SimpleActionDemo
        title="Show info({ md5: true })"
        action={withCurrentFile(async (file) => file.info({ md5: true }))}
      />
    </>
  );
}

// ===== Section: Read & Write Operations =====

function ReadWriteSection({ withCurrentFile }: { withCurrentFile: WithCurrentFile }) {
  return (
    <>
      <HeadingText>Read Operations</HeadingText>
      <SimpleActionDemo
        title="text()"
        action={withCurrentFile(async (file) => truncate(await file.text()))}
      />
      <SimpleActionDemo
        title="base64() (first 100 chars)"
        action={withCurrentFile(async (file) => truncate(await file.base64(), 100))}
      />
      <SimpleActionDemo
        title="bytes() (length + first 20)"
        action={withCurrentFile(async (file) => {
          const bytes = await file.bytes();
          return {
            length: bytes.length,
            first20: Array.from(bytes.slice(0, 20)),
          };
        })}
      />

      <HeadingText>Write Operations</HeadingText>
      <Text style={styles.note}>Works on local and picked files. Throws on static assets.</Text>
      <SimpleActionDemo
        title="write() text"
        action={withCurrentFile(async (file) => {
          file.write('Written at ' + new Date().toISOString());
          return 'OK - size is now: ' + file.size;
        })}
      />
      <SimpleActionDemo
        title="write() base64"
        action={withCurrentFile(async (file) => {
          // Base64 of "Hello Base64!"
          file.write('SGVsbG8gQmFzZTY0IQ==', { encoding: 'base64' });
          return 'OK - text() = ' + truncate(await file.text());
        })}
      />
      <SimpleActionDemo
        title="write() Uint8Array"
        action={withCurrentFile(async (file) => {
          const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
          file.write(bytes);
          return 'OK - text() = ' + file.textSync();
        })}
      />
    </>
  );
}

// ===== Section: File Handle (Random Access) =====

function FileHandleSection({ currentFile }: { currentFile: File | null }) {
  const handleRef = useRef<FileHandle | null>(null);
  const [handleInfo, setHandleInfo] = useState<string | null>(null);
  const [handleLog, setHandleLog] = useState('');
  const [openMode, setOpenMode] = useState<FileMode>(FileMode.ReadWrite);

  useEffect(() => {
    return () => {
      try {
        handleRef.current?.close();
      } catch {}
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (handleRef.current) {
      try {
        handleRef.current.close();
      } catch {}
      handleRef.current = null;
      setHandleInfo(null);
      setHandleLog('');
    }
  }, [currentFile]);

  function appendLog(line: string) {
    setHandleLog((prev) => (prev ? prev + '\n' + line : line));
  }

  return (
    <>
      <HeadingText>File Handle (Random Access)</HeadingText>
      <Text style={styles.note}>Works on local and picked files</Text>
      {Platform.OS === 'android' && (
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Mode:</Text>
          {Object.entries(FileMode).map(([label, value]) => (
            <TouchableOpacity
              key={value}
              style={[styles.enumButton, openMode === value && styles.enumButtonActive]}
              onPress={() => setOpenMode(value)}>
              <Text
                style={[styles.enumButtonText, openMode === value && styles.enumButtonTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <ListButton
        title={`Open file handle${Platform.OS === 'android' ? ` (${openMode})` : ''}`}
        disabled={!currentFile}
        onPress={() => {
          try {
            if (handleRef.current) {
              handleRef.current.close();
            }
            const handle = currentFile!.open(openMode);
            handleRef.current = handle;
            setHandleInfo(`offset=${handle.offset}, size=${handle.size}`);
            setHandleLog(`Handle opened (mode=${openMode})`);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
      <ListButton
        title="Read 10 bytes"
        disabled={!handleRef.current}
        onPress={() => {
          try {
            const bytes = handleRef.current!.readBytes(10);
            setHandleInfo(`offset=${handleRef.current!.offset}, size=${handleRef.current!.size}`);
            appendLog(`Read ${bytes.length}B: [${Array.from(bytes).join(', ')}]`);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
      <ListButton
        title="Write 'TEST' bytes"
        disabled={!handleRef.current}
        onPress={() => {
          try {
            handleRef.current!.writeBytes(new Uint8Array([84, 69, 83, 84]));
            setHandleInfo(`offset=${handleRef.current!.offset}, size=${handleRef.current!.size}`);
            appendLog('Wrote 4 bytes (TEST)');
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
      <ListButton
        title="Seek to offset 0"
        disabled={!handleRef.current}
        onPress={() => {
          try {
            handleRef.current!.offset = 0;
            setHandleInfo(`offset=${handleRef.current!.offset}, size=${handleRef.current!.size}`);
            appendLog('Seeked to 0');
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
      <ListButton
        title="Seek to offset 5"
        disabled={!handleRef.current}
        onPress={() => {
          try {
            handleRef.current!.offset = 5;
            setHandleInfo(`offset=${handleRef.current!.offset}, size=${handleRef.current!.size}`);
            appendLog('Seeked to 5');
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
      <ListButton
        title="Close handle"
        disabled={!handleRef.current}
        onPress={() => {
          try {
            handleRef.current!.close();
            handleRef.current = null;
            setHandleInfo('closed');
            appendLog('Handle closed');
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
      {handleInfo && <MonoText>Handle: {handleInfo}</MonoText>}
      {handleLog.length > 0 && <MonoText>{handleLog}</MonoText>}
    </>
  );
}

// ===== Section: Copy & Move =====

function CopyMoveSection({
  withCurrentFile,
  safDirectory,
  setSafDirectory,
}: {
  withCurrentFile: WithCurrentFile;
  safDirectory: Directory | null;
  setSafDirectory: (dir: Directory) => void;
}) {
  const [overwrite, setOverwrite] = useState(false);

  return (
    <>
      <HeadingText>Copy & Move</HeadingText>
      <View style={styles.optionRow}>
        <Checkbox value={overwrite} onValueChange={setOverwrite} style={styles.checkbox} />
        <Text style={styles.optionLabel}>overwrite</Text>
      </View>
      <SimpleActionDemo
        title="Copy to cache dir (file://)"
        action={withCurrentFile(async (file) => {
          const dest = new Directory(Paths.cache, 'test_sandbox_copy');
          dest.create({ intermediates: true, idempotent: true });
          await file.copy(dest, { overwrite });
          return dest.list().map((f) => f.name);
        })}
      />
      <SimpleActionDemo
        title="Copy to document dir (file://)"
        action={withCurrentFile(async (file) => {
          const dest = new Directory(Paths.document, 'test_sandbox_copy');
          dest.create({ intermediates: true, idempotent: true });
          await file.copy(dest, { overwrite });
          return { destUri: dest.uri, files: dest.list().map((f) => f.name) };
        })}
      />

      <ListButton
        title="Pick destination directory"
        onPress={async () => {
          try {
            const dir = await Directory.pickDirectoryAsync();
            setSafDirectory(dir as Directory);
            Alert.alert('SAF directory', dir.uri);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
      {safDirectory && (
        <SimpleActionDemo
          title="Copy to destination directory"
          action={withCurrentFile(async (file) => {
            await file.copy(safDirectory, { overwrite });
            return safDirectory.list().map((f) => f.name);
          })}
        />
      )}

      <SimpleActionDemo
        title="Move to cache/moved/ (destructive!)"
        action={withCurrentFile(async (file) => {
          const dest = new Directory(Paths.cache, 'test_sandbox_moved');
          dest.create({ intermediates: true, idempotent: true });
          const oldUri = file.uri;
          await file.move(dest, { overwrite });
          return { oldUri, newUri: file.uri };
        })}
      />
      <SimpleActionDemo
        title="Rename to 'renamed_test.txt'"
        action={withCurrentFile(async (file) => {
          const oldUri = file.uri;
          file.rename('renamed_test.txt');
          return { oldUri, newUri: file.uri };
        })}
      />
    </>
  );
}

// ===== Section: Picked Directory Operations =====

function DirectoryOperationsSection({
  safDirectory,
  setSafDirectory,
  setCurrentFile,
}: {
  safDirectory: Directory | null;
  setSafDirectory: (dir: Directory) => void;
  setCurrentFile: (f: File) => void;
}) {
  return (
    <>
      <HeadingText>Picked Directory Operations</HeadingText>
      <ListButton
        title="Pick directory"
        onPress={async () => {
          try {
            const dir = await Directory.pickDirectoryAsync();
            setSafDirectory(dir as Directory);
            Alert.alert('Picked', dir.uri);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
      {safDirectory && (
        <>
          <MonoText>SAF Dir: {truncate(safDirectory.uri, 80)}</MonoText>

          <SimpleActionDemo
            title="List directory contents"
            action={async () =>
              safDirectory.list().map((item) => ({
                name: item.name,
                uri: item.uri,
                isDir: item instanceof Directory,
              }))
            }
          />
          <SimpleActionDemo
            title="Directory properties"
            action={async () => ({
              uri: safDirectory.uri,
              name: safDirectory.name,
              exists: safDirectory.exists,
              size: safDirectory.size,
            })}
          />
          <SimpleActionDemo
            title="Create file 'test_created.txt' in picked dir"
            action={async () => {
              const file = safDirectory.createFile('test_created.txt', 'text/plain');
              file.write('Created at ' + new Date().toISOString());
              setCurrentFile(file);
              return { uri: file.uri, name: file.name };
            }}
          />
          <SimpleActionDemo
            title="Create subdirectory 'test_subdir'"
            action={async () => {
              const subdir = safDirectory.createDirectory('test_subdir');
              return { uri: subdir.uri, name: subdir.name, exists: subdir.exists };
            }}
          />
          <SimpleActionDemo
            title="Delete last item in picked dir"
            action={async () => {
              const items = safDirectory.list();
              if (items.length === 0) throw new Error('Directory is empty');
              const last = items[items.length - 1];
              const name = last.name;
              last.delete();
              return `Deleted: ${name}`;
            }}
          />
        </>
      )}
    </>
  );
}

// ===== Section: Content URI & Intents (Android) =====

function AndroidIntentsSection({
  currentFile,
  withCurrentFile,
}: {
  currentFile: File | null;
  withCurrentFile: WithCurrentFile;
}) {
  return (
    <>
      <HeadingText>Content URI & Intents</HeadingText>
      <SimpleActionDemo
        title="Get contentUri for current file"
        action={withCurrentFile(async (file) => ({
          original: file.uri,
          contentUri: file.contentUri,
          type: file.type,
        }))}
      />
      <ListButton
        title="Open current file with intent"
        disabled={!currentFile}
        onPress={async () => {
          try {
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: currentFile!.contentUri,
              flags: 1,
              type: currentFile!.type || '*/*',
            });
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
      <ListButton
        title="Open asset (expo-root.pem) with intent"
        onPress={async () => {
          try {
            const file = new File(Paths.bundle, 'expo-root.pem');
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: file.contentUri,
              flags: 1,
              type: 'application/x-pem-file',
            });
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
    </>
  );
}

// ===== Section: File Lifecycle =====

function FileLifecycleSection({
  setCurrentFile,
  withCurrentFile,
}: {
  setCurrentFile: (f: File) => void;
  withCurrentFile: WithCurrentFile;
}) {
  return (
    <>
      <HeadingText>File Lifecycle</HeadingText>
      <SimpleActionDemo
        title="Create new file in cache"
        action={async () => {
          const name = `test_${Date.now()}.txt`;
          const file = new File(Paths.cache, 'test_sandbox', name);
          file.create({ intermediates: true });
          file.write('Created for lifecycle test');
          setCurrentFile(file);
          return { uri: file.uri, exists: file.exists, size: file.size };
        }}
      />
      <SimpleActionDemo
        title="Check exists"
        action={withCurrentFile(async (file) => ({
          exists: file.exists,
          uri: file.uri,
        }))}
      />
      <SimpleActionDemo
        title="Delete current file"
        action={withCurrentFile(async (file) => {
          file.delete();
          return { deleted: true, existsAfter: file.exists };
        })}
      />
    </>
  );
}

// ===== Section: File Lifecycle =====
function FilePickerSection({ setCurrentFile }: { setCurrentFile: (f: File) => void }) {
  const { width } = useWindowDimensions();
  const [multiple, setMultiple] = useState(false);
  const [pdfMime, setPdfMime] = useState(false);
  const [allMime, setAllMime] = useState(true);
  const [imageMime, setPngMime] = useState(false);
  const [pickerResult, setPickerResult] = useState<File | File[] | null>(null);
  const mimeTypes = (): string[] => {
    const mimeTypesArr: string[] = [];
    if (pdfMime) mimeTypesArr.push('application/pdf');
    if (allMime) mimeTypesArr.push('*/*');
    if (imageMime) mimeTypesArr.push('image/*');
    return mimeTypesArr;
  };

  const openPicker = async () => {
    try {
      const multipleFiles = multiple;
      const { result, canceled } = multiple
        ? await File.pickFileAsync({
            multipleFiles: true,
            mimeTypes: mimeTypes(),
          })
        : await File.pickFileAsync({ multipleFiles: false, mimeTypes: mimeTypes() });
      if (!canceled) {
        if (!multipleFiles) {
          setCurrentFile(result as File);
        }
        setPickerResult(result as File | File[]);
      } else {
        setTimeout(() => {
          if (Platform.OS === 'web') {
            alert('canceled');
          } else {
            Alert.alert('canceled');
          }
        }, 100);
      }
    } catch (err) {
      console.error('Error picking file:', err);
      setTimeout(() => {
        Alert.alert('error', `Error picking file: ${err}`);
      }, 150);
    }
  };
  return (
    <>
      <HeadingText>File Picker</HeadingText>
      <View style={styles.optionRow}>
        <Checkbox value={multiple} onValueChange={setMultiple} style={styles.checkbox} />
        <Text style={styles.optionLabel}>multiple files</Text>
      </View>
      <Text>Mime types</Text>
      <View style={styles.optionRow}>
        <Checkbox value={imageMime} onValueChange={setPngMime} style={styles.checkbox} />
        <Text style={styles.optionLabel}>images</Text>
      </View>
      <View style={styles.optionRow}>
        <Checkbox value={pdfMime} onValueChange={setPdfMime} style={styles.checkbox} />
        <Text style={styles.optionLabel}>pdf files</Text>
      </View>
      <View style={styles.optionRow}>
        <Checkbox value={allMime} onValueChange={setAllMime} style={styles.checkbox} />
        <Text style={styles.optionLabel}>all files</Text>
      </View>
      <Text> Selected mime types: {JSON.stringify(mimeTypes())}</Text>
      <SimpleActionDemo
        title={multiple ? 'Pick multiple files' : 'Pick a single file'}
        action={async () => {
          await openPicker();
        }}
      />
      <View
        style={{
          padding: 20,
          maxWidth: width - 40,
          width: '100%',
          justifyContent: 'flex-start',
        }}>
        {Array.of(pickerResult)
          .flat()
          .map((file, index) => {
            if (!file) return null;

            return (
              <View
                key={`${index}-${file?.contentUri}`}
                style={{ marginBottom: 20, width: '100%', flex: 1 }}>
                {file?.name!.match(/\.(png|jpg)$/gi) ? (
                  <Image
                    source={{ uri: file.uri }}
                    resizeMode="cover"
                    style={{ width: 100, height: 100 }}
                  />
                ) : null}
                <Text numberOfLines={1} ellipsizeMode="middle">
                  {file?.name} ({file?.size! / 1000} KB)
                </Text>
                <Text numberOfLines={1} ellipsizeMode="middle">
                  URI: {file?.uri}
                </Text>
                <Text numberOfLines={1} ellipsizeMode="middle">
                  Mime type: {file?.type}
                </Text>
                <Text>Last modified: {file?.lastModified}</Text>
              </View>
            );
          })}
      </View>
    </>
  );
}

// ===== Section: Download Progress =====

function DownloadSection() {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done' | 'cancelled' | 'error'>(
    'idle'
  );
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const startDownload = async () => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('downloading');
    setProgress(null);
    setError(null);
    setResultUri(null);

    const dest = new File(Paths.cache, 'large-download-test.bin');
    if (dest.exists) {
      dest.delete();
    }

    try {
      // ~100 MB test file
      const file = await File.downloadFileAsync('https://proof.ovh.net/files/100Mb.dat', dest, {
        idempotent: true,
        signal: controller.signal,
        onProgress: (data: DownloadProgress) => {
          setProgress({ ...data });
        },
      });
      setResultUri(file.uri);
      setStatus('done');
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setStatus('cancelled');
      } else {
        setError(e.message ?? String(e));
        setStatus('error');
      }
    } finally {
      controllerRef.current = null;
    }
  };

  const abort = () => {
    controllerRef.current?.abort();
  };

  const cleanup = () => {
    const dest = new File(Paths.cache, 'large-download-test.bin');
    if (dest.exists) {
      dest.delete();
    }
    setStatus('idle');
    setProgress(null);
    setError(null);
    setResultUri(null);
  };

  const pct =
    progress && progress.totalBytes > 0
      ? ((progress.bytesWritten / progress.totalBytes) * 100).toFixed(1)
      : null;

  return (
    <>
      <HeadingText>Large File Download (100 MB)</HeadingText>

      {status === 'idle' && <ListButton title="Start download" onPress={startDownload} />}

      {status === 'downloading' && (
        <>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFg,
                  { width: (pct ? `${pct}%` : '0%') as DimensionValue },
                ]}
              />
            </View>
            <MonoText>
              {progress
                ? `${formatBytes(progress.bytesWritten)} / ${formatBytes(progress.totalBytes)}${pct ? ` (${pct}%)` : ''}`
                : 'Starting...'}
            </MonoText>
          </View>
          <ListButton title="Abort download" onPress={abort} />
        </>
      )}

      {status === 'done' && (
        <>
          <Text style={styles.successText}>Download complete</Text>
          <MonoText>{resultUri}</MonoText>
          <ListButton title="Clean up & reset" onPress={cleanup} />
        </>
      )}

      {status === 'cancelled' && (
        <>
          <Text style={styles.cancelledText}>Download cancelled</Text>
          <ListButton title="Clean up & reset" onPress={cleanup} />
        </>
      )}

      {status === 'error' && (
        <>
          <Text style={styles.errorText}>Error: {error}</Text>
          <ListButton title="Clean up & reset" onPress={cleanup} />
        </>
      )}
    </>
  );
}

// ===== Section: Zip / Unzip =====

function listContents(dir: Directory | { uri: string }) {
  // Wrap in JS Directory to get .list() – native return types may not be the JS class
  const jsDir = dir instanceof Directory ? dir : new Directory(dir.uri);
  return jsDir.list().map((item) => ({
    name: item.uri.split('/').filter(Boolean).pop(),
    isDir: item instanceof Directory,
  }));
}

function ZipSection({
  currentFile,
  safDirectory,
  withCurrentFile,
}: {
  currentFile: File | null;
  safDirectory: Directory | null;
  withCurrentFile: WithCurrentFile;
}) {
  const [zipResult, setZipResult] = useState<string | null>(null);

  return (
    <>
      <HeadingText>Zip / Unzip</HeadingText>
      <Text style={styles.note}>
        Uses current file / picked SAF directory when available, or creates test data.
      </Text>

      {/* — Zip current file — */}
      <SimpleActionDemo
        title="Zip current file"
        action={withCurrentFile(async (file) => {
          const archive = await file.zip(new File(Paths.cache, 'current_file.zip'), {
            overwrite: true,
          });
          setZipResult(archive.uri);
          return { source: file.uri, archive: archive.uri, size: archive.size };
        })}
      />

      <SimpleActionDemo
        title="Zip current file (sync)"
        action={withCurrentFile(async (file) => {
          const archive = file.zipSync(new File(Paths.cache, 'current_file_sync.zip'), {
            overwrite: true,
          });
          setZipResult(archive.uri);
          return { source: file.uri, archive: archive.uri, size: archive.size };
        })}
      />

      {/* — Zip picked SAF directory — */}
      <SimpleActionDemo
        title="Zip picked SAF directory"
        action={async () => {
          if (!safDirectory) throw new Error('Pick a directory first (in Directory Operations).');
          const archive = await safDirectory.zip(new File(Paths.cache, 'saf_dir.zip'), {
            overwrite: true,
          });
          setZipResult(archive.uri);
          return { source: safDirectory.uri, archive: archive.uri, size: archive.size };
        }}
      />

      {/* — Zip a generated test directory — */}
      <SimpleActionDemo
        title="Zip test directory (with nested content)"
        action={async () => {
          const dir = new Directory(Paths.cache, 'zip_test');
          if (dir.exists) dir.delete();
          dir.create();
          new File(dir, 'hello.txt').write('Hello from zip test!');
          new File(dir, 'data.json').write(
            JSON.stringify({ message: 'test data', timestamp: Date.now() })
          );
          const subdir = dir.createDirectory('subdir');
          new File(subdir, 'nested.txt').write('Nested file content');

          const archive = await dir.zip(new File(Paths.cache, 'test_dir.zip'), { overwrite: true });
          setZipResult(archive.uri);
          return { source: dir.uri, archive: archive.uri, size: archive.size };
        }}
      />

      {/* — Compression options — */}
      <SimpleActionDemo
        title="Zip current file (BestCompression)"
        action={withCurrentFile(async (file) => {
          const archive = await file.zip(new File(Paths.cache, 'best_compression.zip'), {
            overwrite: true,
            compressionLevel: CompressionLevel.BestCompression,
          });
          setZipResult(archive.uri);
          return { source: file.uri, size: archive.size };
        })}
      />

      <SimpleActionDemo
        title="Zip current file (no compression / store)"
        action={withCurrentFile(async (file) => {
          const archive = await file.zip(new File(Paths.cache, 'stored.zip'), {
            overwrite: true,
            compressionLevel: CompressionLevel.None,
          });
          setZipResult(archive.uri);
          return { source: file.uri, size: archive.size, originalSize: file.size };
        })}
      />

      {/* — Multi-source zip — */}
      <SimpleActionDemo
        title="Zip multiple sources (current file + extra)"
        action={withCurrentFile(async (file) => {
          const extra = new File(Paths.cache, 'zip_extra.txt');
          extra.write('Extra file content: ' + Date.now());
          const archive = await zip([file, extra], new File(Paths.cache, 'multi_source.zip'), {
            overwrite: true,
          });
          setZipResult(archive.uri);
          return { sources: [file.uri, extra.uri], archive: archive.uri, size: archive.size };
        })}
      />

      {/* — Zip to directory (auto-name) — */}
      <SimpleActionDemo
        title="Zip current file to cache dir (auto-name)"
        action={withCurrentFile(async (file) => {
          const archive = await file.zip(Paths.cache);
          setZipResult(archive.uri);
          return { archive: archive.uri, size: archive.size };
        })}
      />

      {/* — Unzip — */}
      {zipResult && (
        <View style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={styles.note}>Last archive: {truncate(zipResult, 60)}</Text>
        </View>
      )}

      <SimpleActionDemo
        title="Unzip last archive (async)"
        action={async () => {
          if (!zipResult) throw new Error('No archive created yet. Zip something first.');
          const dest = new Directory(Paths.cache, 'unzipped');
          if (dest.exists) dest.delete();
          const result = await new File(zipResult).unzip(dest);
          return { destination: result.uri, contents: listContents(result) };
        }}
      />

      <SimpleActionDemo
        title="Unzip last archive (sync)"
        action={async () => {
          if (!zipResult) throw new Error('No archive created yet. Zip something first.');
          const dest = new Directory(Paths.cache, 'unzipped_sync');
          if (dest.exists) dest.delete();
          const result = new File(zipResult).unzipSync(dest);
          return { destination: result.uri, contents: listContents(result) };
        }}
      />

      <SimpleActionDemo
        title="Unzip with module-level unzip()"
        action={async () => {
          if (!zipResult) throw new Error('No archive created yet. Zip something first.');
          const dest = new Directory(Paths.cache, 'unzipped_module');
          if (dest.exists) dest.delete();
          const result = await unzip(new File(zipResult), dest);
          return { destination: result.uri, contents: listContents(result) };
        }}
      />

      {/* — Round-trip — */}
      <SimpleActionDemo
        title="Round-trip: zip current file → unzip → verify"
        action={withCurrentFile(async (file) => {
          const archive = await file.zip(new File(Paths.cache, 'roundtrip.zip'), {
            overwrite: true,
          });
          const dest = new Directory(Paths.cache, 'roundtrip_out');
          if (dest.exists) dest.delete();
          await archive.unzip(dest);

          const baseName = file.uri.split('/').filter(Boolean).pop()!;
          const unzippedFile = new File(dest, baseName);
          const originalContent = truncate(file.textSync(), 100);
          const unzippedContent = truncate(unzippedFile.textSync(), 100);

          return {
            archiveSize: archive.size,
            originalContent,
            unzippedContent,
            match: file.textSync() === unzippedFile.textSync(),
          };
        })}
      />
    </>
  );
}

// ===== Styles =====

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 10,
  },
  note: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    paddingHorizontal: 5,
  },
  currentFileBar: {
    backgroundColor: '#e8e8ff',
    padding: 8,
    borderRadius: 4,
  },
  currentFileText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  optionLabel: {
    fontSize: 13,
  },
  checkbox: {
    width: 18,
    height: 18,
  },
  enumButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#999',
  },
  enumButtonActive: {
    backgroundColor: '#4630eb',
    borderColor: '#4630eb',
  },
  enumButtonText: {
    fontSize: 11,
    color: '#333',
  },
  enumButtonTextActive: {
    color: '#fff',
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBarBg: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFg: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  progressText: {
    marginTop: 4,
    fontSize: 13,
    color: '#555',
  },
  successText: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  cancelledText: {
    color: '#f57c00',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  errorText: {
    color: '#c62828',
    marginVertical: 4,
  },
  uriText: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
});
