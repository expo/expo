const bunyan = require('@expo/bunyan');

const PRINT_JSON_LOGS = process.env.JSON_LOGS === '1';
const LOGGER_NAME = 'tools-public';

module.exports = PRINT_JSON_LOGS ? bunyan.createLogger({ name: LOGGER_NAME }) : console;
