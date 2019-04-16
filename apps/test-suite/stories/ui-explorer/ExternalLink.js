import AppText from './AppText';
import React from 'react';

const ExternalLink = props => <AppText {...props} accessibilityRole="link" target="_blank" />;

export default ExternalLink;
