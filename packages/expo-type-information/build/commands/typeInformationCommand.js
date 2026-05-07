"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeInformationCommand = typeInformationCommand;
const commandUtils_1 = require("./commandUtils");
const typeInformation_1 = require("../typeInformation");
function typeInformationCommand(cli) {
    return (0, commandUtils_1.addCommonOptions)(cli.command('type-information')).action(async (options) => {
        const parsedArgs = await (0, commandUtils_1.parseCommandArguments)(options);
        if (!parsedArgs) {
            return;
        }
        const command = async () => {
            const typeInfo = await (0, commandUtils_1.getFileTypeInformationFromArgs)(parsedArgs);
            if (!typeInfo) {
                return;
            }
            const typeInfoSerialized = (0, typeInformation_1.serializeTypeInformation)(typeInfo);
            const typeInfoSerializedString = JSON.stringify(typeInfoSerialized, null, 2);
            (0, commandUtils_1.writeStringToFileOrPrintToConsole)(typeInfoSerializedString, parsedArgs.realOutputPath);
        };
        (0, commandUtils_1.runCommandOnWatch)(parsedArgs, command);
    });
}
//# sourceMappingURL=typeInformationCommand.js.map