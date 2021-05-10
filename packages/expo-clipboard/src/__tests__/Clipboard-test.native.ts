import Clipboard from '../Clipboard';
describe('Clipboard', () => {
  it('does not log deprecation notice', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    Clipboard.setString('Dumbledore');
    expect(consoleSpy).toHaveBeenCalledTimes(0);
  });
});
