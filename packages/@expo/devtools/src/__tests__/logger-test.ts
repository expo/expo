import * as logger from '../logger';

describe('logger', () => {
  const spyLog = jest.spyOn(console, 'info').mockImplementation(() => {});

  afterEach(() => {
    logger.setEnableLogging(false);
  });
  it('should not log by default', () => {
    logger.info('test');
    expect(spyLog).not.toHaveBeenCalled();
  });

  it('should logger when enabled', () => {
    logger.setEnableLogging(true);
    logger.info('test logging');
    expect(spyLog).toHaveBeenCalled();
    expect(spyLog.mock.calls[0][0]).toBe('test logging');
  });
});
