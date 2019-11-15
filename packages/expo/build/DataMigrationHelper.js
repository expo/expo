import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
export const LOCK_FILE_NAME = "migrationLock64537438658125";
export function getLegacyDocumentDirectoryAndroid() {
    if (Platform.OS !== 'android' || FileSystem.documentDirectory == null) {
        return null;
    }
    // expo-file-system decodes paths so we need to encode twice
    let id = encodeURIComponent(encodeURIComponent(Constants.manifest.id));
    const oldFilesDirectory = `${FileSystem.documentDirectory}ExperienceData/${id}/`;
    return oldFilesDirectory;
}
export const noopResolve = async (legacyFile, currentFile) => {
    // do nothing! leave legacy and current file
};
async function treeSearch(relativePath, legacyPath, newPath, resolveConflict) {
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
        for (let child of children) {
            await treeSearch(relativePath + `${child}/`, legacyPath, newPath, resolveConflict);
        }
    }
    else {
        await resolveConflict(currentLegacyPath, currentNewPath);
    }
}
async function doesOldFilesDirectoryContainLock(path) {
    const children = await FileSystem.readDirectoryAsync(path);
    return children.indexOf(LOCK_FILE_NAME) > -1;
}
async function addLockToOldFilesDirectory(path) {
    await FileSystem.writeAsStringAsync(path + LOCK_FILE_NAME, "lock");
}
export async function migrateFilesFromLegacyDirectoryAsync(resolveConflict) {
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
    if (!doesOldFilesDirectoryExist || await doesOldFilesDirectoryContainLock(oldFilesDirectory)) {
        return;
    }
    if (resolveConflict == null) {
        await FileSystem.copyAsync({
            from: oldFilesDirectory,
            to: newFilesDirectory,
        });
        await FileSystem.deleteAsync(oldFilesDirectory);
    }
    else {
        await treeSearch("", oldFilesDirectory, newFilesDirectory, resolveConflict);
        await addLockToOldFilesDirectory(oldFilesDirectory);
    }
}
//# sourceMappingURL=DataMigrationHelper.js.map