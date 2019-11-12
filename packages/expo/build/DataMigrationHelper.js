import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
export function getLegacyDocumentDirectoryAndroid() {
    if (Platform.OS !== 'android' || FileSystem.documentDirectory == null) {
        return null;
    }
    // expo-file-system decodes paths so we need to encode twice
    let id = encodeURIComponent(encodeURIComponent(Constants.manifest.id));
    const oldFilesDirectory = `${FileSystem.documentDirectory}ExperienceData/${id}`;
    return oldFilesDirectory;
}
export async function migrateFilesFromLegacyDirectoryAsync() {
    const { appOwnership } = Constants;
    if (Platform.OS === 'android' && appOwnership === "standalone") {
        const oldFilesDirectory = getLegacyDocumentDirectoryAndroid();
        const newFilesDirectory = FileSystem.documentDirectory;
        if (oldFilesDirectory == null || newFilesDirectory == null) {
            return;
        }
        const oldFilesDirectoryInfo = await FileSystem.getInfoAsync(oldFilesDirectory);
        const doesOldFilesDirectoryExist = oldFilesDirectoryInfo["exists"];
        if (doesOldFilesDirectoryExist) {
            await FileSystem.copyAsync({
                from: oldFilesDirectory,
                to: newFilesDirectory,
            });
            await FileSystem.deleteAsync(oldFilesDirectory);
        }
    }
}
//# sourceMappingURL=DataMigrationHelper.js.map