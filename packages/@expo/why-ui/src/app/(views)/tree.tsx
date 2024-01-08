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

export default function Treemap() {
  const modules = useFilteredModules();
  const [isNodeModulesVisible, setIsNodeModulesVisible] = useState(true);
  const [regexString, setRegExp] = useState<string>('');
  const [excludeString, setExcludeRegExp] = useState<string>('');

  const filteredForNodeModules = useMemo(() => {
    if (!isNodeModulesVisible) {
      return modules.filter((v) => !v.isNodeModule);
    }
    return modules;
  }, [modules, isNodeModulesVisible]);

  const filteredModules = useMemo(() => {
    let filtered = filteredForNodeModules;

    if (regexString) {
      const regex = new RegExp(regexString, 'i');
      filtered = filtered.filter((v) => regex.test(v.path));
    }

    if (excludeString) {
      const regex = new RegExp(excludeString, 'i');
      filtered = filtered.filter((v) => !regex.test(v.path));
    }

    return filtered;
  }, [filteredForNodeModules, regexString, excludeString]);

  return (
    <Sheet modal={false}>
      <div className="flex flex-1 flex-col">
        <div className="p-2 justify-end flex">
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
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="include" className="text-right">
              Files to Include
            </Label>
            <Input
              id="include"
              value={regexString}
              onChange={(e) => {
                setRegExp(e.target.value);
              }}
              placeholder=".*"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="exclude" className="text-right">
              Files to Exclude
            </Label>
            <Input
              id="exclude"
              value={excludeString}
              onChange={(e) => {
                setExcludeRegExp(e.target.value);
              }}
              placeholder=".*"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
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
