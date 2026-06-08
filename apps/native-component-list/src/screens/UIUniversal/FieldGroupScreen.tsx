import { Button, FieldGroup, Host, Row, Slider, Spacer, Switch, Text } from '@expo/ui';
import { useState } from 'react';

export default function FieldGroupScreen() {
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [previewsOnLockScreen, setPreviewsOnLockScreen] = useState(true);

  const [brightness, setBrightness] = useState(0.6);
  const [textSize, setTextSize] = useState(0.5);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [boldText, setBoldText] = useState(false);
  const [increaseContrast, setIncreaseContrast] = useState(false);

  const [locationEnabled, setLocationEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [crashReportsEnabled, setCrashReportsEnabled] = useState(true);
  const [personalizedAds, setPersonalizedAds] = useState(false);

  const [autoplayVideos, setAutoplayVideos] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [highQualityDownloads, setHighQualityDownloads] = useState(true);
  const [downloadOverCellular, setDownloadOverCellular] = useState(false);

  const [airplaneMode, setAirplaneMode] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <FieldGroup>
        {/* Direct non-Section children are auto-grouped into an implicit section, matching SwiftUI `Form` behavior. */}
        <LabeledRow label="Airplane mode">
          <Switch value={airplaneMode} onValueChange={setAirplaneMode} />
        </LabeledRow>
        <LabeledRow label="Wi-Fi">
          <Text>SSID-Home</Text>
        </LabeledRow>
        <LabeledRow label="Bluetooth">
          <Text>On</Text>
        </LabeledRow>

        <FieldGroup.Section title="Notifications">
          <LabeledRow label="Push notifications">
            <Switch value={notifications} onValueChange={setNotifications} />
          </LabeledRow>
          <LabeledRow label="Sounds">
            <Switch value={sounds} onValueChange={setSounds} />
          </LabeledRow>
          <LabeledRow label="Haptics">
            <Switch value={haptics} onValueChange={setHaptics} />
          </LabeledRow>
          <LabeledRow label="Email digest">
            <Switch value={emailDigest} onValueChange={setEmailDigest} />
          </LabeledRow>
          <LabeledRow label="Previews on lock screen">
            <Switch value={previewsOnLockScreen} onValueChange={setPreviewsOnLockScreen} />
          </LabeledRow>
          <FieldGroup.SectionFooter>
            <Text textStyle={{ fontSize: 13, color: '#6c6c70' }}>
              Notification previews can expose sensitive content on the lock screen.
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Display & accessibility">
          <LabeledRow label="Brightness">
            <Slider value={brightness} onValueChange={setBrightness} />
          </LabeledRow>
          <LabeledRow label="Text size">
            <Slider value={textSize} onValueChange={setTextSize} />
          </LabeledRow>
          <LabeledRow label="Theme">
            <Text>System</Text>
          </LabeledRow>
          <LabeledRow label="Reduce motion">
            <Switch value={reduceMotion} onValueChange={setReduceMotion} />
          </LabeledRow>
          <LabeledRow label="Bold text">
            <Switch value={boldText} onValueChange={setBoldText} />
          </LabeledRow>
          <LabeledRow label="Increase contrast">
            <Switch value={increaseContrast} onValueChange={setIncreaseContrast} />
          </LabeledRow>
          <FieldGroup.SectionFooter>
            <Text textStyle={{ fontSize: 13, color: '#6c6c70' }}>
              Brightness auto-adjusts based on ambient light when the slider is near max.
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Privacy">
          <LabeledRow label="Location services">
            <Switch value={locationEnabled} onValueChange={setLocationEnabled} />
          </LabeledRow>
          <LabeledRow label="Share analytics">
            <Switch value={analyticsEnabled} onValueChange={setAnalyticsEnabled} />
          </LabeledRow>
          <LabeledRow label="Send crash reports">
            <Switch value={crashReportsEnabled} onValueChange={setCrashReportsEnabled} />
          </LabeledRow>
          <LabeledRow label="Personalized ads">
            <Switch value={personalizedAds} onValueChange={setPersonalizedAds} />
          </LabeledRow>
          <FieldGroup.SectionFooter>
            <Text textStyle={{ fontSize: 13, color: '#6c6c70' }}>
              Turning off crash reports makes it harder for us to fix issues you encounter.
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Media & downloads">
          <LabeledRow label="Autoplay videos">
            <Switch value={autoplayVideos} onValueChange={setAutoplayVideos} />
          </LabeledRow>
          <LabeledRow label="Data saver">
            <Switch value={dataSaver} onValueChange={setDataSaver} />
          </LabeledRow>
          <LabeledRow label="High-quality downloads">
            <Switch value={highQualityDownloads} onValueChange={setHighQualityDownloads} />
          </LabeledRow>
          <LabeledRow label="Download over cellular">
            <Switch value={downloadOverCellular} onValueChange={setDownloadOverCellular} />
          </LabeledRow>
        </FieldGroup.Section>

        <FieldGroup.Section title="Storage">
          <LabeledRow label="Cache">
            <Text>248 MB</Text>
          </LabeledRow>
          <LabeledRow label="Downloads">
            <Text>1.2 GB</Text>
          </LabeledRow>
          <LabeledRow label="Documents">
            <Text>84 MB</Text>
          </LabeledRow>
          <Row alignment="center" style={{ padding: 12 }}>
            <Spacer flexible />
            <Button variant="outlined" onPress={() => alert('Cache cleared')} label="Clear cache" />
            <Spacer flexible />
          </Row>
        </FieldGroup.Section>

        <FieldGroup.Section title="Connected devices">
          <LabeledRow label="Ada's iPhone">
            <Text>This device</Text>
          </LabeledRow>
          <LabeledRow label="Office Mac">
            <Text>2 days ago</Text>
          </LabeledRow>
          <LabeledRow label="Living room Apple TV">
            <Text>Last week</Text>
          </LabeledRow>
          <LabeledRow label="Studio iPad">
            <Text>3 weeks ago</Text>
          </LabeledRow>
        </FieldGroup.Section>

        <FieldGroup.Section title="Account">
          <LabeledRow label="Signed in as">
            <Text>ada@example.com</Text>
          </LabeledRow>
          <LabeledRow label="Plan">
            <Text>Pro</Text>
          </LabeledRow>
          <LabeledRow label="Billing">
            <Text>Visa •••• 4242</Text>
          </LabeledRow>
        </FieldGroup.Section>

        <FieldGroup.Section title="About">
          <LabeledRow label="Version">
            <Text>1.42.0</Text>
          </LabeledRow>
          <LabeledRow label="Terms of service">
            <Text>›</Text>
          </LabeledRow>
          <LabeledRow label="Privacy policy">
            <Text>›</Text>
          </LabeledRow>
          <LabeledRow label="Open source licenses">
            <Text>›</Text>
          </LabeledRow>
          <FieldGroup.SectionFooter>
            <Text textStyle={{ fontSize: 13, color: '#6c6c70' }}>Build 4215 (2026.04.15)</Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section>
          <Row alignment="center" style={{ padding: 12 }}>
            <Spacer flexible />
            <Button variant="outlined" onPress={() => alert('Signed out')} label="Sign out" />
            <Spacer flexible />
          </Row>
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}

function LabeledRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Row alignment="center" spacing={16}>
      <Text>{label}</Text>
      <Spacer flexible />
      {children}
    </Row>
  );
}

FieldGroupScreen.navigationOptions = {
  title: 'FieldGroup',
};
