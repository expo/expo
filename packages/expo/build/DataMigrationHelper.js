import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
;
export const LOCK_FILE_NAME = "migrationLock#6453743";
export function getLegacyDocumentDirectoryAndroid() {
    if (Platform.OS !== 'android' || FileSystem.documentDirectory == null) {
        return null;
    }
    // expo-file-system decodes paths so we need to encode twice
    let id = encodeURIComponent(encodeURIComponent(Constants.manifest.id));
    const oldFilesDirectory = `${FileSystem.documentDirectory}ExperienceData/${id}/`;
    return oldFilesDirectory;
}
export const NOOP_CONFLICT_RESOLVER = {
    async onConflict(legacyFile, currentFile) {
        // do nothing! leave legacy and current file
    }
};
async function treeSearch(relativePath, legacyPath, newPath, conflictResolver) {
    const currentNewPath = `${newPath}${relativePath}`;
    const currentLegacyPath = `${legacyPath}${relativePath}`;
    const legacyPathInfo = await FileSystem.getInfoAsync(currentLegacyPath);
    const newPathInfo = await FileSystem.getInfoAsync(currentNewPath);
    if (legacyPathInfo.exists && !newPathInfo.exists) {
        await FileSystem.copyAsync({
            from: currentLegacyPath,
            to: currentNewPath,
        });
        await FileSystem.deleteAsync(currentLegacyPath);
        return;
    }
    if (legacyPathInfo.isDirectory) {
        const children = await FileSystem.readDirectoryAsync(currentLegacyPath);
        children.forEach(async (child) => {
            treeSearch(relativePath + `${child}/`, legacyPath, newPath, conflictResolver);
        });
    }
    else {
        conflictResolver.onConflict(currentLegacyPath, currentNewPath);
    }
}
async function doesOldFilesDirectoryContainsLock(path) {
    const children = await FileSystem.readDirectoryAsync(path);
    return children.indexOf(LOCK_FILE_NAME) > -1;
}
async function addLockToOldFilesDirectory(path) {
    await FileSystem.writeAsStringAsync(path + LOCK_FILE_NAME, "lock");
}
export async function migrateFilesFromLegacyDirectoryAsync(conflictResolver) {
    const { appOwnership } = Constants;
    if (Platform.OS !== 'android' || appOwnership !== "standalone") {
        return;
    }
    const oldFilesDirectory = getLegacyDocumentDirectoryAndroid();
    const newFilesDirectory = FileSystem.documentDirectory;
    if (oldFilesDirectory == null || newFilesDirectory == null) {
        return;
    }
    const oldFilesDirectoryInfo = await FileSystem.getInfoAsync(oldFilesDirectory);
    const doesOldFilesDirectoryExist = oldFilesDirectoryInfo["exists"];
    if (!doesOldFilesDirectoryExist) {
        return;
    }
    if (await doesOldFilesDirectoryContainsLock(oldFilesDirectory)) {
        return;
    }
    if (conflictResolver == null) {
        await FileSystem.copyAsync({
            from: oldFilesDirectory,
            to: newFilesDirectory,
        });
        await FileSystem.deleteAsync(oldFilesDirectory);
    }
    else {
        await treeSearch("", oldFilesDirectory, newFilesDirectory, conflictResolver);
        await addLockToOldFilesDirectory(oldFilesDirectory);
    }
}
//# sourceMappingURL=DataMigrationHelper.js.map