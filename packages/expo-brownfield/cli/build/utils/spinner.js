"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSpinner = void 0;
const ora_1 = __importDefault(require("ora"));
const withSpinner = async ({ operation, loaderMessage, successMessage, errorMessage, onError = 'error', verbose = false, }) => {
    let spinner;
    try {
        if (!verbose) {
            spinner = (0, ora_1.default)(loaderMessage).start();
        }
        const result = await operation();
        if (!verbose) {
            spinner?.succeed(successMessage);
        }
        return result;
    }
    catch (error) {
        if (!verbose) {
            onError === 'error' ? spinner?.fail(errorMessage) : spinner?.warn(errorMessage);
        }
        throw new Error(errorMessage);
    }
    finally {
        if (!verbose && spinner?.isSpinning) {
            spinner?.stop();
        }
    }
};
exports.withSpinner = withSpinner;
