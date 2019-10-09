import Adapter from 'enzyme-adapter-react-16';
import Enzyme from 'enzyme';
import serializer from './serializer';

Enzyme.configure({ adapter: new Adapter() });

// @ts-ignore: test types are not available in src/
expect.addSnapshotSerializer(serializer);
