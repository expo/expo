"use client";
import { Button } from 'react-native';
import { mappedAction } from './actions';
export default function Client() { return <Button title="Run action" onPress={() => mappedAction()} />; }
