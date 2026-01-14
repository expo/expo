#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resolve_1 = require("./commands/resolve");
(async () => {
    const command = (0, resolve_1.resolveCommand)();
    await command.run();
})();
