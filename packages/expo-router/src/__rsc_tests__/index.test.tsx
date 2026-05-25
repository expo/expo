import { Link } from '../index';

it('default import supports RSC', async () => {
  const jsx = <Link href="/" />;

  await expect(jsx).toMatchFlightSnapshot();
});
