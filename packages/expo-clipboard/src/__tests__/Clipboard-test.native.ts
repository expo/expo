import Clipboard from '../Clipboard';
describe('Clipboard', () => {
  it('does not log deprecation notice', async () => {
    const consoleSpy = jest.spyOn(console, 'error');
    Clipboard.setStringAsync('Dumbledore');
    expect(consoleSpy).toHaveBeenCalledTimes(0);
  });
});
