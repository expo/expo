import { buildPackage, typecheckFixture } from './utils';

beforeAll(buildPackage);

it('type-checks a config plugin against the built declarations with skipLibCheck disabled', () => {
  expect(typecheckFixture('declarations')).toEqual({ status: 0, stdout: '', stderr: '' });
});
