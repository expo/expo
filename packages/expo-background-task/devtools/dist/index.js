"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const prompts_1 = __importDefault(require("prompts"));
exports.default = () => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield (0, prompts_1.default)([
        {
            type: 'select',
            name: 'color',
            message: 'Select command',
            choices: [
                { title: 'Android: List devices', value: 'listDevices' },
                { title: 'iOS: do something', value: 'doSomething' },
            ],
        },
    ]);
    switch (results.color) {
        case 'listDevices':
            console.log((0, child_process_1.execSync)('adb devices', { encoding: 'utf-8' }).trim());
            break;
        case 'doSomething':
            console.log(chalk_1.default.green('Green'));
            break;
        default:
            console.log(chalk_1.default.white('Unknown color'));
            break;
    }
});
