import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';


export interface ConflictResolver {
    (legacyFile: string, currentFile: string): Promise<void>;
}

export const LOCK_FILE_NAME = "migrationLock64537438658125";

export function getLegacyDocumentDirectoryAndroid(): string | null {
    if (Platform.OS !== 'android' || FileSystem.documentDirectory == null) {
        return null;
    }
    // expo-file-system decodes paths so we need to encode twice
    let id: string = encodeURIComponent(encodeURIComponent(Constants.manifest.id));
    const oldFilesDirectory = `${FileSystem.documentDirectory}ExperienceData/${id}/`;
    return oldFilesDirectory;
}

export const noopResolve: ConflictResolver = async (legacyFile: string, currentFile: string): Promise<void> => {
    // do nothing! leave legacy and current file
};

async function treeSearch(relativePath: string, legacyPath: string, newPath: string, resolveConflict: ConflictResolver): Promise<void> {
    const currentNewPath = `${newPath}${relativePath}`;
    const currentLegacyPath: string = `${legacyPath}${relativePath}`;
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
    } else {
        await resolveConflict(currentLegacyPath, currentNewPath);
    }
}

async function doesOldFilesDirectoryContainLock(path: string): Promise<boolean> {
    const children = await FileSystem.readDirectoryAsync(path);
    return children.indexOf(LOCK_FILE_NAME) > -1;
}

async function addLockToOldFilesDirectory(path: string): Promise<void> {
    await FileSystem.writeAsStringAsync(path + LOCK_FILE_NAME, "lock");
}

export async function migrateFilesFromLegacyDirectoryAsync(resolveConflict?: ConflictResolver): Promise<void> {
    const { appOwnership } = Constants;
    if (Platform.OS !== 'android' || appOwnership !== "standalone") {
        return;
    }
    const oldFilesDirectory = getLegacyDocumentDirectoryAndroid();
    const newFilesDirectory = FileSystem.documentDirectory;
    if (oldFilesDirectory == null || newFilesDirectory == null) {
        return;
    }

    const oldFilesDirectoryInfo = await FileSystem.getInfoAsync(<string>oldFilesDirectory);
    const doesOldFilesDirectoryExist = oldFilesDirectoryInfo["exists"];

    if (!doesOldFilesDirectoryExist) {
        return;
    }

    if (await doesOldFilesDirectoryContainLock(oldFilesDirectory)) {
        return;
    }

    if (resolveConflict == null) {
        await FileSystem.copyAsync({
            from: <string>oldFilesDirectory,
            to: <string>newFilesDirectory,
        });
        await FileSystem.deleteAsync(<string>oldFilesDirectory);
    } else {
        await treeSearch("", oldFilesDirectory, newFilesDirectory, resolveConflict);
        await addLockToOldFilesDirectory(oldFilesDirectory);
    }
}
