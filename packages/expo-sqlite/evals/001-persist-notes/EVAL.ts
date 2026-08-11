import { check, score, type Scorer } from '../harness/types';

/**
 * The prompt asks for durable notes plus a schema-evolution story. The skill
 * teaches PRAGMA user_version migrations, SQLiteProvider onInit, and
 * parameterized writes — this scorer checks whether those idioms landed.
 */
const scorer: Scorer = async (ctx) => {
  const source = ctx.sourceFiles()
    .map((f) => f.contents)
    .join('\n');
  const packageJson = ctx.packageJson();
  const typecheck = await ctx.typecheck();

  return score([
    check('imports expo-sqlite', /from ['"]expo-sqlite['"]/.test(source)),
    check(
      'opens the database through the supported entry points',
      /openDatabaseAsync\(|<SQLiteProvider[\s/>]/.test(source)
    ),
    check(
      'versions the schema with PRAGMA user_version',
      /PRAGMA user_version/i.test(source),
      'CREATE TABLE on every launch has no upgrade path for existing data'
    ),
    check(
      'binds parameters instead of interpolating values into SQL',
      /runAsync\(\s*['"][^'"]*[?$]/.test(source) || /\.sql[<`]/.test(source),
      'expects runAsync with ?/$ placeholders or the db.sql tagged template'
    ),
    check(
      'does not add an async-storage dependency for structured data',
      !packageJson?.dependencies?.['@react-native-async-storage/async-storage']
    ),
    { name: 'typescript compiles', status: typecheck.status, notes: typecheck.output || undefined },
  ]);
};

export default scorer;
