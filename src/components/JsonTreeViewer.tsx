import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check, Code2 } from 'lucide-react';
import { ParsedJsonData } from '../types';

interface JsonTreeViewerProps {
  data: ParsedJsonData;
  rawText: string;
}

export const JsonTreeViewer: React.FC<JsonTreeViewerProps> = ({ data, rawText }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 p-2.5 rounded-lg">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
          <Code2 className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {data.isArray ? `Array with ${data.itemCount} items` : `Object with ${data.itemCount} properties`}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium border border-white/10 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy JSON'}</span>
        </button>
      </div>

      {/* Interactive JSON Explorer */}
      <div className="rounded-xl border border-white/10 bg-[#18181B] p-4 font-mono text-xs overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-white/10">
        <JsonNode value={data.data} isLast={true} name={null} depth={0} />
      </div>
    </div>
  );
};

interface JsonNodeProps {
  name: string | number | null;
  value: any;
  isLast: boolean;
  depth: number;
}

const JsonNode: React.FC<JsonNodeProps> = ({ name, value, isLast, depth }) => {
  const [collapsed, setCollapsed] = useState(depth > 2);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  if (isObject) {
    const keys = Object.keys(value);
    const isEmpty = keys.length === 0;
    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';

    return (
      <div style={{ paddingLeft: depth > 0 ? '16px' : '0px' }} className="my-0.5 leading-relaxed">
        <div
          onClick={() => !isEmpty && setCollapsed(!collapsed)}
          className={`inline-flex items-center gap-1 hover:bg-white/5 px-1 py-0.5 rounded cursor-pointer select-none transition-colors ${
            isEmpty ? 'cursor-default' : ''
          }`}
        >
          {!isEmpty && (
            <span className="text-gray-500 hover:text-gray-300">
              {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          )}
          {name !== null && <span className="text-[#9146FF]">"{name}": </span>}
          <span className="text-gray-400 font-semibold">{openBracket}</span>
          {collapsed && (
            <span className="text-gray-500 text-[10px] mx-1 px-1 rounded bg-white/5">
              {keys.length} {isArray ? 'items' : 'keys'}
            </span>
          )}
          {collapsed && <span className="text-gray-400 font-semibold">{closeBracket}</span>}
          {collapsed && !isLast && <span className="text-gray-500">,</span>}
        </div>

        {!collapsed && (
          <div className="border-l border-white/10 pl-1 ml-2 my-0.5">
            {keys.map((k, idx) => (
              <JsonNode
                key={k}
                name={isArray ? null : k}
                value={value[k]}
                isLast={idx === keys.length - 1}
                depth={depth + 1}
              />
            ))}
          </div>
        )}

        {!collapsed && (
          <div style={{ paddingLeft: '16px' }} className="text-gray-400 font-semibold">
            {closeBracket}
            {!isLast && <span className="text-gray-500">,</span>}
          </div>
        )}
      </div>
    );
  }

  const renderPrimitive = (val: any) => {
    if (val === null) return <span className="text-rose-400">null</span>;
    if (val === undefined) return <span className="text-gray-500">undefined</span>;
    if (typeof val === 'boolean') {
      return <span className="text-amber-400 font-semibold">{String(val)}</span>;
    }
    if (typeof val === 'number') {
      return <span className="text-emerald-400 font-semibold">{val}</span>;
    }
    return <span className="text-sky-300">"{String(val)}"</span>;
  };

  return (
    <div style={{ paddingLeft: depth > 0 ? '16px' : '0px' }} className="my-0.5 leading-relaxed">
      {name !== null && <span className="text-[#9146FF]">"{name}": </span>}
      {renderPrimitive(value)}
      {!isLast && <span className="text-gray-500">,</span>}
    </div>
  );
};
