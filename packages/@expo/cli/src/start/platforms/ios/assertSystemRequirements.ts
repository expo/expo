import { profile } from '../../../utils/profile';
import { XcodePrerequisite } from '../../doctor/apple/XcodePrerequisite';
import { XcodeSimulatorPrerequisite } from '../../doctor/apple/XcodeSimulatorPrerequisite';
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
    XcodeSimulatorPrerequisite.instance.assertAsync.bind(XcodeSimulatorPrerequisite.instance),
    'SimulatorAppPrerequisite'
  )();
}
