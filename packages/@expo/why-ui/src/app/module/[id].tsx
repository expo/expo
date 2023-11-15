import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link, router, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { BaconCode } from '../../components/code';
import { MetroJsonModule } from '../../components/data';
import { useGraph } from '../../components/deps-context';
import { Button } from '@/components/ui/button';

export function SelectScrollable({ parents }: { parents: string[] }) {
  return (
    <Select
      onValueChange={(value) => {
        router.push({ pathname: '/module/[id]', params: { id: value } });
      }}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a parent" />
      </SelectTrigger>
      <SelectContent>
        {parents.map((parent) => (
          <SelectItem key={parent} value={parent}>
            {parent}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function ModuleInspection() {
  const { id } = useLocalSearchParams();
  const { modules } = useGraph();
  const p = decodeURIComponent(id);
  const selected = modules.find((m) => m.path === p);
  console.log('selected', selected, p);
  if (!selected) {
    return null;
  }
  // http://localhost:8082/module/..%2F..%2Fpackages%2F%40expo%2Fmetro-runtime%2Fsrc%2Fasync-require%2FloadBundle.ts

  return <DependencyInfo {...selected} />;
}

function getExtension(path: string) {
  const match = path.match(/\.([^.]+)$/);
  return match?.[1] ?? 'js';
}

function DependencyInfo({
  getSource,
  inverseDependencies,
  output,
  path,
  absolutePath,
  dependencies,
}: MetroJsonModule) {
  const jsModules = output.filter(({ type }) => type.startsWith('js/'));

  const codeBlocks = React.useMemo(
    () => <CodeBody {...{ getSource, output, path }} />,
    [getSource, output, path]
  );
  return (
    <div className="flex flex-1 bg-[#000] border-l border-l-[#ffffff1a]">
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <span className="flex border-b border-b-[#ffffff1a] flex-col justify-between">
          <div className="flex flex-1 flex-row p-2 items-center justify-between border-b border-b-[#ffffff1a]">
            <Link href="/" className="text-[#6272a4]">
              <Button variant="ghost">← Go Back</Button>
            </Link>

            <span>
              <Button
                className="text-[#6272a4]"
                variant="ghost"
                onClick={() => {
                  fetch('/open-stack-frame', {
                    method: 'POST',
                    body: JSON.stringify({
                      file: absolutePath,
                      lineNumber: 0,
                    }),
                  });
                }}>
                Editor
              </Button>

              <Button
                className="text-[#6272a4]"
                variant="ghost"
                onClick={() => {
                  inspectSourcemaps({
                    code: jsModules[0].data.code,
                    sourcemaps: jsModules[0].data.map,
                  });
                }}>
                Source Maps →
              </Button>
            </span>
          </div>
          <div className="flex flex-1 flex-row p-2 px-6 border-b border-b-[#ffffff1a] justify-between items-center">
            {/* <FileIcon className="w-4 text-slate-50" /> */}
            <span className="text-slate-50 text-lg font-bold">File: {path}</span>
            <SelectScrollable parents={inverseDependencies} />
          </div>

          <div className="flex flex-1 flex-row p-2 px-6 items-center justify-center">
            <div className="flex flex-1 items-center">
              <p className="flex text-slate-50 font-bold text-lg">Source</p>
            </div>

            <div className="flex flex-1">
              <p className="flex text-slate-50 font-bold text-lg">Output</p>
            </div>
          </div>
        </span>

        {/* Body */}
        {codeBlocks}

        {/* Footer */}
      </div>
    </div>
  );
}

function CodeBody({
  getSource,
  output,
  path,
}: Pick<MetroJsonModule, 'getSource' | 'output' | 'path'>) {
  const jsModules = output.filter(({ type }) => type.startsWith('js/'));

  const items = React.useMemo(
    () => [
      <BaconCode
        dependencies={{}}
        className={'language-' + getExtension(path)}
        metastring=""
        children={getSource}
      />,
      <BaconCode
        dependencies={{}}
        className="language-js"
        metastring=""
        children={jsModules[0].data.code}
      />,
    ],
    []
  );
  return (
    <div className="flex flex-1 relative">
      <div className="absolute top-0 left-0 bottom-0 right-0 flex flex-1 flex-row">
        {items.map((code, i) => (
          <div key={String(i)} className="max-w-[50%] w-[50%] h-full flex flex-1  bg-[#282a36]">
            {code}
          </div>
        ))}
      </div>
    </div>
  );
}

export function inspectSourcemaps({ code, sourcemaps }: { code: string; sourcemaps?: string }) {
  // easier debugging of sourcemaps
  // eslint-disable-next-line no-console
  console.info('sourcemaps', JSON.stringify(sourcemaps, null, 2));

  const serialized = serializeForSourcemapsVisualizer(code, sourcemaps!);
  // open link in new tab
  window.open(`https://evanw.github.io/source-map-visualization#${serialized}`, '_blank');
}

// serialize to base64 and delimited by null characters and code length
// parser code: https://github.com/evanw/source-map-visualization/blob/5c08ef62f3eff597796f1b5c73ae822d9f467d00/code.js#L1794
function serializeForSourcemapsVisualizer(code: string, map: string) {
  const encoder = new TextEncoder();

  // Convert the strings to Uint8Array
  const codeArray = encoder.encode(code);
  const mapArray = encoder.encode(map);

  // Create Uint8Array for the lengths
  const codeLengthArray = encoder.encode(codeArray.length.toString());
  const mapLengthArray = encoder.encode(mapArray.length.toString());

  // Combine the lengths and the data
  const combinedArray = new Uint8Array(
    codeLengthArray.length + 1 + codeArray.length + mapLengthArray.length + 1 + mapArray.length
  );

  combinedArray.set(codeLengthArray);
  combinedArray.set([0], codeLengthArray.length);
  combinedArray.set(codeArray, codeLengthArray.length + 1);
  combinedArray.set(mapLengthArray, codeLengthArray.length + 1 + codeArray.length);
  combinedArray.set([0], codeLengthArray.length + 1 + codeArray.length + mapLengthArray.length);
  combinedArray.set(
    mapArray,
    codeLengthArray.length + 1 + codeArray.length + mapLengthArray.length + 1
  );

  // Convert the Uint8Array to a binary string
  let binary = '';
  const len = combinedArray.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(combinedArray[i]);

  // Convert the binary string to a base64 string and return it
  return btoa(binary);
}

function formatSize(size: number) {
  if (size < 1024) {
    return size + 'B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + 'KB';
  } else {
    return (size / 1024 / 1024).toFixed(1) + 'MB';
  }
}

export function msToTime(ms: number) {
  if (ms <= 0.5) return '<1ms';
  if (ms < 2000) return `${ms}ms`;
  const seconds = +(ms / 1000).toFixed(1);
  if (seconds < 60) return `${seconds}s`;
  const minutes = +(ms / (1000 * 60)).toFixed(1);
  if (minutes < 60) return `${minutes}m`;
  const hours = +(ms / (1000 * 60 * 60)).toFixed(1);
  if (hours < 24) return `${hours}h`;
  const days = +(ms / (1000 * 60 * 60 * 24)).toFixed(1);
  return `${days}d`;
}
