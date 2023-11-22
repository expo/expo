/**
 * Install the `expo` package
 *
 * @param projectRoot target project root folder
 * @param sdkVersion expo sdk version
 */
export declare function installExpoPackageAsync(projectRoot: string, sdkVersion: string): Promise<void>;
/**
 * Running `pod install` for the target project
 *
 * @param projectRoot target project root folder
 */
export declare function installPodsAsync(projectRoot: string): Promise<void>;
