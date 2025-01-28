'use dom';

export default function Page(_: { dom?: import('expo/dom').DOMProps }) {
  return (
    <img
      src={`${process.env.EXPO_BASE_URL}react-logo.png`}
      width={128}
      height={128}
      alt="React logo"
    />
  );
}
