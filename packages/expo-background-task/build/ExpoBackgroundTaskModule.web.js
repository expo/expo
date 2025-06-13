"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BackgroundTask_types_1 = require("./BackgroundTask.types");
exports.default = {
    async getStatusAsync() {
        return BackgroundTask_types_1.BackgroundTaskStatus.Restricted;
    },
};
