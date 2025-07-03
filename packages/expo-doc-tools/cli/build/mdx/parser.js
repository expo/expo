"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexMdxFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const gray_matter_1 = __importDefault(require("gray-matter"));
const path_1 = __importDefault(require("path"));
const vectorDb_1 = __importDefault(require("../db/vectorDb"));
const embedding_1 = require("../utils/embedding");
/**
 * Indexes MDX files in a directory and saves the metadata, content, and embeddings to a database.
 * @param directory Directory containing MDX files
 * @param dbpath Path to save the database file
 */
const indexMdxFiles = async (directory, dbpath) => {
    console.log(`Building vector database from ${directory} into database at ${dbpath}...`);
    const files = await fs_1.default.promises.readdir(directory);
    const db = await new vectorDb_1.default();
    let pageCount = 0;
    for (const file of files) {
        const filePath = path_1.default.join(directory, file);
        if (path_1.default.extname(file) === '.mdx') {
            try {
                const { metadata, content } = await parseMdx(filePath);
                const embedding = await (0, embedding_1.embedText)(content);
                db.addDocument(file, { metadata, content, embedding });
                pageCount++;
            }
            catch (err) {
                throw new Error('Error processing file:' + file + '\n' + err);
            }
        }
    }
    db.saveToFile(dbpath).catch((err) => {
        throw new Error('Error saving database to file: ' + dbpath + '\n' + err);
    });
    console.log(`Indexed ${pageCount} MDX files from ${directory} into database at ${dbpath}`);
};
exports.indexMdxFiles = indexMdxFiles;
async function parseMdx(filePath) {
    const fileContent = await fs_1.default.promises.readFile(filePath, 'utf-8');
    // Extract frontmatter and content
    const { data: metadata, content: mdContent } = (0, gray_matter_1.default)(fileContent);
    const { unified } = await import('unified');
    const remarkParse = (await import('remark-parse')).default;
    const remarkStringify = (await import('remark-stringify')).default;
    const { VFile } = await import('vfile');
    // Parse MDX to plain text (strip JSX, etc.)
    const file = new VFile({ value: mdContent });
    const processed = await unified().use(remarkParse).use(remarkStringify).process(file);
    const content = String(processed);
    return {
        metadata,
        content,
    };
}
//# sourceMappingURL=parser.js.map