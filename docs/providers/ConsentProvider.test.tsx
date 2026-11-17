import { getDataGrailContainerId } from './ConsentProvider';

const PRODUCTION_CONTAINER_ID = '4eb52ba0-0d2c-4c0c-b086-eb6c1a64a189';
const STAGING_CONTAINER_ID = 'a7095413-bb49-40c3-a291-2b78cd6ebb8f';

describe(getDataGrailContainerId, () => {
  it('uses the production container on the production docs host', () => {
    expect(getDataGrailContainerId('docs.expo.dev')).toBe(PRODUCTION_CONTAINER_ID);
  });

  it('uses the staging container on Cloudflare Pages preview hosts', () => {
    expect(getDataGrailContainerId('pr-1234.expo-docs.pages.dev')).toBe(STAGING_CONTAINER_ID);
  });

  it('uses the staging container on localhost', () => {
    expect(getDataGrailContainerId('localhost:3002')).toBe(STAGING_CONTAINER_ID);
  });

  it('uses the staging container when the host is unknown', () => {
    expect(getDataGrailContainerId('')).toBe(STAGING_CONTAINER_ID);
  });
});
