"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const CreateProject_1 = __importDefault(require("./commands/CreateProject"));
const RunTest_1 = __importDefault(require("./commands/RunTest"));
const program = commander_1.default.version('0.0.1');
[CreateProject_1.default, RunTest_1.default].forEach((command) => command(program));
program.parse(process.argv);
//# sourceMappingURL=index.js.map