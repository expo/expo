import React, { useMemo, useState } from 'react';

import { useFilteredModules } from '@/components/deps-context';
import { TreemapGraph } from '@/components/tree/echart-tree';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

function padSpaces(str: string, length: number) {
  return '0'.repeat(length - str.length) + str;
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export default function Treemap() {
  const modules = useFilteredModules();
  const [isNodeModulesVisible, setIsNodeModulesVisible] = useState(true);
  // const [disabledNodeModules, setDisabledNodeModules] = useState<string[]>([]);
  const [regexString, setRegExp] = useState<string>('');
  const [excludeString, setExcludeRegExp] = useState<string>('');

  const filteredForNodeModules = useMemo(() => {
    if (!isNodeModulesVisible) {
      return modules.filter((v) => !v.isNodeModule);
    }
    return modules;
  }, [modules, isNodeModulesVisible]);

  // const nodeModuleToggleNames = useMemo(() => {
  //   return uniq(modules.map((v) => v.nodeModuleName)).sort();
  // }, [modules]);

  const filteredModules = useMemo(() => {
    let filtered = filteredForNodeModules;

    // if (disabledNodeModules.length > 0) {
    //   filtered = filtered.filter((v) => !disabledNodeModules.includes(v.nodeModuleName));
    // }

    if (regexString) {
      try {
        const regex = new RegExp(regexString, 'i');
        filtered = filtered.filter((v) => regex.test(v.path));
      } catch (error) {
        console.error(error);
      }
    }

    if (excludeString) {
      try {
        const regex = new RegExp(excludeString, 'i');
        filtered = filtered.filter((v) => !regex.test(v.path));
      } catch (error) {
        console.error(error);
      }
    }

    return filtered;
  }, [
    // disabledNodeModules,
    filteredForNodeModules,
    regexString,
    excludeString,
  ]);

  return (
    <Sheet modal={false}>
      <div className="flex flex-1 flex-col relative">
        <div className="p-2 justify-end flex absolute top-0 right-0 z-10">
          <SheetTrigger asChild>
            <Button variant="outline">Filters</Button>
          </SheetTrigger>
        </div>

        <TreemapGraph modules={filteredModules} />
      </div>

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tree Controls</SheetTitle>
          <SheetDescription>
            Filter the tree to show only the modules you want to see.
          </SheetDescription>
          <SheetDescription>
            Total modules:{' '}
            <span className="font-mono">
              {padSpaces(filteredModules.length + '', (modules.length + '').length)}/
              {modules.length}
            </span>
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="include">Files to Include</Label>
            <Input
              id="include"
              value={regexString}
              onChange={(e) => {
                setRegExp(e.target.value);
              }}
              placeholder="e.g. react-native"
              className="col-span-3"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="exclude">Files to Exclude</Label>
            <Input
              id="exclude"
              value={excludeString}
              onChange={(e) => {
                setExcludeRegExp(e.target.value);
              }}
              placeholder="e.g. node_modules\/.*.ts"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label
              htmlFor="node_modules"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Node Modules
            </Label>
            <Checkbox
              id="node_modules"
              checked={isNodeModulesVisible}
              onCheckedChange={() => setIsNodeModulesVisible((visible) => !visible)}
            />
          </div>
          {/* {nodeModuleToggleNames.map((name) => (
            <div key={name} className="grid grid-cols-2 items-center gap-4">
              <Label
                htmlFor={name}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {name}
              </Label>
              <Checkbox
                id={name}
                checked={!disabledNodeModules.includes(name)}
                onCheckedChange={() => {
                  // TODO
                  setDisabledNodeModules((modules) => {
                    if (modules.includes(name)) {
                      return modules.filter((v) => v !== name);
                    }
                    return [...modules, name];
                  });
                }}
              />
            </div>
          ))} */}
        </div>
        <SheetFooter>
          <Button
            onClick={() => {
              setRegExp('');
              setExcludeRegExp('');
              setIsNodeModulesVisible(true);
            }}
            type="reset">
            Reset Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
