import commander from 'commander';
/**
 * A cli command which:
 * - creates InlineModulesList.kt file
 * - mirrors directory structure of watched directories
 * - symlinks the original kotlin files in the new mirror directories.
 */
export declare function mirrorKotlinInlineModulesCommand(cli: commander.CommanderStatic): commander.Command;
