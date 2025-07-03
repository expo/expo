/**
 * Indexes MDX files in a directory and saves the metadata, content, and embeddings to a database.
 * @param directory Directory containing MDX files
 * @param dbpath Path to save the database file
 */
export declare const indexMdxFiles: (directory: string, dbpath: string) => Promise<void>;
