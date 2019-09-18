import Adapter from 'enzyme-adapter-react-16';
import Enzyme from 'enzyme';
import serializer from './serializer';

declare const global: { expect: any };
  
Enzyme.configure({ adapter: new Adapter() });

global.expect.addSnapshotSerializer(serializer);
