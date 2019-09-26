import ExponentAccelerometer from './ExponentAccelerometer';
import ThreeAxisSensor from './ThreeAxisSensor';

export default new ThreeAxisSensor(ExponentAccelerometer, 'accelerometerDidUpdate');
