import { CommanderStatic } from 'commander';
import { Config } from './Config';
import { Platform } from './Platform';
export interface DefaultOptions {
    configFile: string;
    platform: Platform;
    path: string;
    shouldBeCleaned: boolean;
}
export declare function registerCommand<OptionsType extends DefaultOptions>(commander: CommanderStatic, commandName: string, fn: (config: Config, options: OptionsType) => Promise<any>): import("commander").Command;
