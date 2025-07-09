export interface Client {
    getRootPathAsync(): Promise<string>;
    isFileIgnoredAsync(filePath: string): Promise<boolean>;
}
export default function getVCSClientAsync(projectDir: string): Promise<Client>;
