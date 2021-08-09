import 'jest-enzyme';
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

import serializer from './serializer';

Enzyme.configure({ adapter: new Adapter() });

// @ts-ignore: test types are not available in src/
expect.addSnapshotSerializer(serializer);
