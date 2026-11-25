import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import { axe } from '~/common/test-utilities';

import { Tab } from './Tab';
import { Tabs } from './Tabs';
import { TabsGroup } from './TabsGroup';

const renderWithIntl = (element: React.ReactElement) =>
  render(<IntlProvider locale="en">{element}</IntlProvider>);

describe('TabsGroup', () => {
  it('syncs the selected index across sibling Tabs', async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <TabsGroup>
        <Tabs>
          <Tab label="One">FirstOne</Tab>
          <Tab label="Two">FirstTwo</Tab>
        </Tabs>
        <Tabs>
          <Tab label="One">SecondOne</Tab>
          <Tab label="Two">SecondTwo</Tab>
        </Tabs>
      </TabsGroup>
    );

    expect(screen.getByText('FirstOne')).toBeVisible();
    expect(screen.getByText('SecondOne')).toBeVisible();
    expect(screen.getByText('FirstTwo')).not.toBeVisible();
    expect(screen.getByText('SecondTwo')).not.toBeVisible();

    // Click "Two" in the first group only.
    await user.click(screen.getAllByRole('tab', { name: 'Two' })[0]);

    // Both groups follow.
    expect(screen.getByText('FirstTwo')).toBeVisible();
    expect(screen.getByText('SecondTwo')).toBeVisible();
    expect(screen.getByText('FirstOne')).not.toBeVisible();
    expect(screen.getByText('SecondOne')).not.toBeVisible();
  });

  it('keeps standalone Tabs (no TabsGroup) independent', async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <>
        <Tabs>
          <Tab label="One">AlphaOne</Tab>
          <Tab label="Two">AlphaTwo</Tab>
        </Tabs>
        <Tabs>
          <Tab label="One">BetaOne</Tab>
          <Tab label="Two">BetaTwo</Tab>
        </Tabs>
      </>
    );

    await user.click(screen.getAllByRole('tab', { name: 'Two' })[0]);

    expect(screen.getByText('AlphaTwo')).toBeVisible();
    expect(screen.getByText('BetaTwo')).not.toBeVisible();
    expect(screen.getByText('BetaOne')).toBeVisible();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithIntl(
      <TabsGroup>
        <Tabs>
          <Tab label="One">FirstOne</Tab>
          <Tab label="Two">FirstTwo</Tab>
        </Tabs>
      </TabsGroup>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Tabs keyboard navigation', () => {
  it('moves selection with arrow keys via Radix roving focus', async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Tabs>
        <Tab label="One">PanelOne</Tab>
        <Tab label="Two">PanelTwo</Tab>
        <Tab label="Three">PanelThree</Tab>
      </Tabs>
    );

    await user.click(screen.getByRole('tab', { name: 'One' }));

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('PanelTwo')).toBeVisible();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('PanelThree')).toBeVisible();
    expect(screen.getByText('PanelOne')).not.toBeVisible();
  });
});
