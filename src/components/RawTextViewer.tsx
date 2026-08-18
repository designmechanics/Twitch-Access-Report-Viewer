import React, { useState } from 'react';
import { Copy, Check, WrapText } from 'lucide-react';

interface RawTextViewerProps {
  content: string;
  fileName: string;
}

export const RawTextViewer: React.FC<RawTextViewerProps> = ({ content }) => {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = content.split('\n');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 p-2.5 rounded-lg">
        <div className="text-xs text-gray-400 font-mono">
          <span>{lines.length.toLocaleString()} lines</span>
          <span className="mx-2 text-gray-600">&bull;</span>
          <span>{new Blob([content]).size.toLocaleString()} bytes</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWrapLines(!wrapLines)}
            className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-colors ${
              wrapLines
                ? 'bg-[#9146FF]/10 text-[#bf94ff] border-[#9146FF]/30 font-semibold'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            <WrapText className="w-3.5 h-3.5" />
            <span>Wrap Text</span>
          </button>

          <button
            onClick={handleCopy}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium border border-white/10 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#18181B] font-mono text-xs overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-white/10 flex">
        {/* Line numbers gutter */}
        <div className="bg-[#121214] py-3 px-3 text-right text-gray-600 select-none border-r border-white/5 font-mono text-[11px] leading-relaxed shrink-0 min-w-[48px]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Content */}
        <div
          className={`py-3 px-4 text-gray-300 leading-relaxed font-mono flex-1 ${
            wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
};
