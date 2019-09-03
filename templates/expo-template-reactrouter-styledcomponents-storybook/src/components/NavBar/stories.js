import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { MemoryRouter } from 'react-router';
import NavBar from './';

storiesOf('Components/NavBar', module)
  .addDecorator(story => <MemoryRouter>{story()}</MemoryRouter>)
  .add('default', () => <NavBar />)
