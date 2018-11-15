import path from 'path';
import process from 'process';

import { Fixtures } from '../expotools';

async function action(fixtureFilePath, options) {
  let absoluteFixtureFilePath = path.resolve(process.cwd(), fixtureFilePath);
  await Fixtures.playFixtureAsync(absoluteFixtureFilePath, options.speed || 1.0);
}

export default program => {
  program
    .command('play-fixtures [fixtureFilePath]')
    .description('Replays fixture network activity')
    .option('--speed [number]', 'Change the playback speed')
    .asyncAction(action);
};
