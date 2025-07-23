import { ESLint } from 'eslint';
import process from 'process';

const [, , configString, ...filePatterns] = process.argv;
const config = JSON.parse(configString);

const eslint = new ESLint(config);
const report = await eslint.lintFiles(filePatterns);
console.log(JSON.stringify(report));
