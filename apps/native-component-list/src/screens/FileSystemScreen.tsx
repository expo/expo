import Checkbox from 'expo-checkbox';
import { File, Directory, Paths, FileMode } from 'expo-file-system';
import type { FileHandle } from 'expo-file-system';
import * as Contacts from 'expo-contacts';
import * as DocumentPicker from 'expo-document-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

export default function FileSystemScreen() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [safDirectory, setSafDirectory] = useState<Directory | null>(null);
  const handleRef = useRef<FileHandle | null>(null);
  const [handleInfo, setHandleInfo] = useState<string | null>(null);
  const [handleLog, setHandleLog] = useState('');
  const [openMode, setOpenMode] = useState<FileMode>(FileMode.ReadWrite);
  const [overwrite, setOverwrite] = useState(false);

  // Close handle on unmount
  useEffect(() => {
    return () => {
      if (handleRef.current) {
        try {
          handleRef.current.close();
        } catch { }
        handleRef.current = null;
      }
    };
  }, []);

  // Close handle when currentFile changes
  useEffect(() => {
    if (handleRef.current) {
      try {
        handleRef.current.close();
      } catch { }
      handleRef.current = null;
      setHandleInfo(null);
      setHandleLog('');
    }
  }, [currentFile]);

  function withCurrentFile(fn: (file: File) => Promise<any>) {
    return async () => {
      if (!currentFile) {
        throw new Error('No file selected. Pick or create a file first.');
      }
      return fn(currentFile);
    };
  }

  function appendLog(line: string) {
    setHandleLog((prev) => (prev ? prev + '\n' + line : line));
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        {currentFile && (
          <View style={styles.currentFileBar}>
            <Text style={styles.currentFileText}>Current: {truncate(currentFile.uri, 80)}</Text>
          </View>
        )}

        {/* ===== Section 1: File Sources ===== */}
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
            const result = await File.pickFileAsync();
            const file = Array.isArray(result) ? result[0] : result;
            setCurrentFile(file);
            Alert.alert('Picked SAF file', file.uri);
          }}
        />
        <ListButton
          title="Pick via DocumentPicker"
          onPress={async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: false,
              });
              if (!result.canceled && result.assets?.length > 0) {
                const file = new File(result.assets[0].uri);
                setCurrentFile(file);
                Alert.alert('DocumentPicker file', file.uri);
              }
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
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
                pageSize: 100
              });
              if (contacts.length === 0) {
                Alert.alert('No contacts found');
                return;
              }
              const contactImageURI = contacts.find(contact => contact.imageAvailable)?.image?.uri;
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
              const file = await File.downloadFileAsync(
                'https://httpbin.org/robots.txt',
                dest,
                { idempotent: true }
              );
              setCurrentFile(file);
              Alert.alert('Downloaded', file.uri);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          }}
        />

        {/* ===== Section 2: File Info ===== */}
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

        {/* ===== Section 3: Read Operations ===== */}
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

        {/* ===== Section 4: Write Operations ===== */}
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

        {/* ===== Section 5: File Handle ===== */}
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
                <Text style={[styles.enumButtonText, openMode === value && styles.enumButtonTextActive]}>
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
              setHandleInfo(
                `offset=${handleRef.current!.offset}, size=${handleRef.current!.size}`
              );
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
              setHandleInfo(
                `offset=${handleRef.current!.offset}, size=${handleRef.current!.size}`
              );
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
              setHandleInfo(
                `offset=${handleRef.current!.offset}, size=${handleRef.current!.size}`
              );
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
              setHandleInfo(
                `offset=${handleRef.current!.offset}, size=${handleRef.current!.size}`
              );
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

        {/* ===== Section 6: Copy & Move ===== */}
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
            file.copy(dest, { overwrite });
            return dest.list().map((f) => f.name);
          })}
        />
        <SimpleActionDemo
          title="Copy to document dir (file://)"
          action={withCurrentFile(async (file) => {
            const dest = new Directory(Paths.document, 'test_sandbox_copy');
            dest.create({ intermediates: true, idempotent: true });
            file.copy(dest, { overwrite });
            return { destUri: dest.uri, files: dest.list().map((f) => f.name) };
          })}
        />

        <ListButton
          title="Pick destination directory"
          onPress={async () => {
            try {
              const dir = await Directory.pickDirectoryAsync();
              setSafDirectory(dir);
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
              file.copy(safDirectory, { overwrite });
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
            file.move(dest, { overwrite });
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

        {/* ===== Section 7: Directory Operations ===== */}
        <HeadingText>Picked Directory Operations</HeadingText>
        <ListButton
          title="Pick directory"
          onPress={async () => {
            try {
              const dir = await Directory.pickDirectoryAsync();
              setSafDirectory(dir);
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

        {/* ===== Section 8: Content URI & Intents ===== */}
        {Platform.OS === 'android' && (
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
        )}

        {/* ===== Section 9: File Lifecycle ===== */}
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
      </View>
    </ScrollView>
  );
}

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
});
