/**
 * @providesModule LegacyReact
 */
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import React from 'react';

/* eslint-disable react/no-deprecated */
React.createClass = createReactClass;
React.PropTypes = PropTypes;
