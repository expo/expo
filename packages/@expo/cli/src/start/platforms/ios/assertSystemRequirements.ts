import { profile } from '../../../utils/profile';
import { SimulatorAppPrerequisite } from '../../doctor/apple/SimulatorAppPrerequisite';
import { XcodePrerequisite } from '../../doctor/apple/XcodePrerequisite';
import { XcrunPrerequisite } from '../../doctor/apple/XcrunPrerequisite';

export async function assertSystemRequirementsAsync() {
  // Order is important
  await profile(
    XcodePrerequisite.instance.assertAsync.bind(XcodePrerequisite.instance),
    'XcodePrerequisite'
  )();
  await profile(
    XcrunPrerequisite.instance.assertAsync.bind(XcrunPrerequisite.instance),
    'XcrunPrerequisite'
  )();
  await profile(
    SimulatorAppPrerequisite.instance.assertAsync.bind(SimulatorAppPrerequisite.instance),
    'SimulatorAppPrerequisite'
  )();
}
