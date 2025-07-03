"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const expo_cli_extensions_1 = require("expo-cli-extensions");
const path_1 = __importDefault(require("path"));
const terminal_link_1 = __importDefault(require("terminal-link"));
const vectorDb_1 = __importDefault(require("./db/vectorDb"));
const embedding_1 = require("./utils/embedding");
const DB_PATH = './db.json';
(0, expo_cli_extensions_1.cliExtension)(async (cmd, args) => {
    // Validate command
    if (cmd === 'search_docs') {
        try {
            const query = args.query.toString().trim();
            if (!query) {
                throw new Error('No search query provided.');
            }
            // Open database
            const toolpath = process.argv[1];
            const dbFile = path_1.default.join(toolpath, '../../', DB_PATH);
            const db = await new vectorDb_1.default().loadFromFile(dbFile);
            if (!db) {
                throw new Error(`Database not found or could not be loaded from ${dbFile}.`);
            }
            const embeddings = await (0, embedding_1.embedText)(query);
            // Search the database and return the results - check the source argument to ensure we return the
            // corretly formatted results.
            const results = await db.search(embeddings, args.source === 'mcp' ? 2 : 5);
            if (args.source === 'mcp') {
                // Return results as objects with metadata
                return results.map((r) => ({
                    type: 'text',
                    text: JSON.stringify({
                        ...r.metadata,
                        content: r.content,
                        score: (r.score * 100).toFixed(2) + '%',
                    }),
                }));
            }
            else {
                // Emit results as links to the documentation with scores
                return results.map((r) => ({
                    type: 'text',
                    url: r.metadata.url,
                    text: r.metadata.title + ` (${(r.score * 100).toFixed(2) + '%'})`,
                }));
            }
        }
        catch (error) {
            throw new Error('An error occured connecting to the app:' + error.toString());
        }
    }
    else if (cmd === 'test_command') {
        console.log('Documentation search is working.');
    }
    else {
        return Promise.reject(new Error(`The command ${cmd} is an unknown command for this tool.`));
    }
});
function link(url, { text = url, dim = true } = {}) {
    let output;
    if (terminal_link_1.default.isSupported) {
        output = (0, terminal_link_1.default)(text, url); // Creates clickable link
    }
    else {
        output = `${text === url ? '' : text + ': '}${chalk_1.default.blue.underline(url)}`; // Fallback with blue underline
    }
    return dim ? chalk_1.default.dim(output) : output;
}
//# sourceMappingURL=index.js.map