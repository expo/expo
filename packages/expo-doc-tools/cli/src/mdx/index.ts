import { indexMdxFiles } from './parser';

function main() {
  const directory = process.argv[2];
  const dbpath = process.argv[3];
  if (!directory || !dbpath) {
    console.error('Usage: node parser.js <directory> <dbpath>');
    process.exit(1);
  }
  indexMdxFiles(directory, dbpath)
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error indexing MDX files:', err);
      process.exit(1);
    });
}

main();
