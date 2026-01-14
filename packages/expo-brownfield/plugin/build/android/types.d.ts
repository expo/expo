export interface EnvValue {
    variable: string;
}
export type PublicationType = 'localMaven' | 'localDirectory' | 'remotePublic' | 'remotePrivate' | 'remotePrivateToken';
export interface LocalMavenPublication {
    type: 'localMaven';
}
export interface LocalDirectoryPublication {
    type: 'localDirectory';
    name?: string;
    path: string;
}
export interface RemotePublicPublication {
    type: 'remotePublic';
    name?: string;
    url: string;
    allowInsecure?: boolean;
}
export interface RemotePrivateBasicPublication {
    type: 'remotePrivate';
    name?: string;
    url: string | EnvValue;
    username: string | EnvValue;
    password: string | EnvValue;
    allowInsecure?: boolean;
}
export interface RemotePrivatePublicationInternal extends RemotePrivateBasicPublication {
    url: string;
    username: string;
    password: string;
}
export type Publication = LocalMavenPublication | LocalDirectoryPublication | RemotePublicPublication | RemotePrivateBasicPublication;
export interface PluginConfig {
    group: string;
    libraryName: string;
    package: string;
    packagePath: string;
    projectRoot: string;
    publishing: Publication[];
    version: string;
}
export type AndroidPluginProps = Pick<PluginConfig, 'group' | 'libraryName' | 'package' | 'publishing' | 'version'>;
export type PluginProps = Partial<AndroidPluginProps> | undefined;
