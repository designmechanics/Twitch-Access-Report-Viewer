import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileSpreadsheet,
  FileCode,
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  Layers
} from 'lucide-react';
import { FileTreeNode, ZipFileEntry } from '../types';
import { formatBytes } from '../utils/twitchCategories';

interface FileTreeSidebarProps {
  tree: FileTreeNode[];
  selectedFile: ZipFileEntry | null;
  onSelectFile: (file: ZipFileEntry | null) => void;
  categories: { name: string; count: number; populatedCount?: number }[];
  isOverviewSelected: boolean;
  onSelectOverview: () => void;
  populatedCount?: number;
  totalFilesCount?: number;
}

export const FileTreeSidebar: React.FC<FileTreeSidebarProps> = ({
  tree,
  selectedFile,
  onSelectFile,
  categories,
  isOverviewSelected,
  onSelectOverview,
  populatedCount = 0,
  totalFilesCount = 0
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [populatedOnly, setPopulatedOnly] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const markExpanded = (nodes: FileTreeNode[]) => {
      for (const n of nodes) {
        if (n.isDir) {
          initial[n.path] = true;
          if (n.children) markExpanded(n.children);
        }
      }
    };
    markExpanded(tree);
    return initial;
  });

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    const expandRec = (nodes: FileTreeNode[]) => {
      for (const n of nodes) {
        if (n.isDir) {
          next[n.path] = true;
          if (n.children) expandRec(n.children);
        }
      }
    };
    expandRec(tree);
    setExpandedFolders(next);
  };

  const collapseAll = () => {
    setExpandedFolders({});
  };

  const isNodeMatching = (node: FileTreeNode): boolean => {
    if (!node.isDir && node.fileEntry) {
      const matchSearch =
        !searchTerm ||
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.path.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        selectedCategory === 'all' ||
        node.fileEntry.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchPopulated = !populatedOnly || !!node.isPopulated;

      return matchSearch && matchCategory && matchPopulated;
    }

    if (node.isDir && node.children) {
      return node.children.some((child) => isNodeMatching(child));
    }

    return false;
  };

  const renderFileIcon = (extension?: string) => {
    switch (extension?.toLowerCase()) {
      case 'csv':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'json':
        return <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    }
  };

  const renderTreeNode = (node: FileTreeNode, depth = 0) => {
    if (!isNodeMatching(node)) return null;

    if (node.isDir) {
      const isExpanded = !!expandedFolders[node.path];

      return (
        <div key={node.path} className="select-none flex flex-col">
          <div
            onClick={() => toggleFolder(node.path)}
            className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
              isExpanded
                ? 'text-white bg-[#9146FF]/10'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <span className="text-gray-500">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </span>
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-[#9146FF] shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
            {node.children && (
              <span className="ml-auto text-[10px] font-mono text-gray-500">
                {node.children.filter(c => isNodeMatching(c)).length}
              </span>
            )}
          </div>

          {isExpanded && node.children && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-2.5 flex flex-col">
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const isSelected = !isOverviewSelected && selectedFile?.path === node.path;
    const isPopulated = !!node.isPopulated;

    return (
      <div
        key={node.path}
        onClick={() => node.fileEntry && onSelectFile(node.fileEntry)}
        className={`flex items-center justify-between gap-2 rounded px-2 py-1.5 text-xs cursor-pointer transition-colors ${
          isSelected
            ? 'text-white bg-[#9146FF]/20 border border-[#9146FF]/40 font-semibold'
            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {renderFileIcon(node.extension)}
          <span className="truncate">{node.name}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {node.rowCount !== undefined ? (
            isPopulated ? (
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/40">
                {node.rowCount.toLocaleString()}
              </span>
            ) : (
              <span className="text-[9px] font-mono text-gray-600">
                0
              </span>
            )
          ) : node.size !== undefined ? (
            <span className="text-[10px] font-mono text-gray-500">
              {formatBytes(node.size, 0)}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <aside className="w-72 flex-shrink-0 border-r border-white/10 bg-[#121214] p-3.5 flex flex-col h-[calc(100vh-64px)] overflow-hidden select-none">
      {/* Explorer Header */}
      <div className="mb-3 space-y-2.5">
        {/* Global Archive Overview Button */}
        <button
          onClick={onSelectOverview}
          className={`cursor-pointer w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition-all ${
            isOverviewSelected
              ? 'bg-[#9146FF] text-white border-[#9146FF] shadow-sm'
              : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Archive Summary</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-gray-300">
            {populatedCount}/{totalFilesCount} active
          </span>
        </button>

        <div className="flex items-center justify-between px-1 pt-1">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Archive Explorer
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <button
              onClick={expandAll}
              className="hover:text-gray-300 transition-colors cursor-pointer"
            >
              Expand
            </button>
            <span>&bull;</span>
            <button
              onClick={collapseAll}
              className="hover:text-gray-300 transition-colors cursor-pointer"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search report files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-[#9146FF] focus:outline-none rounded-md pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 transition-colors"
          />
        </div>

        {/* Data Filter Toggle */}
        <div className="flex items-center justify-between gap-1 p-1 bg-white/5 rounded border border-white/10 text-[11px]">
          <button
            onClick={() => setPopulatedOnly(false)}
            className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${
              !populatedOnly
                ? 'bg-[#9146FF] text-white font-bold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Files ({totalFilesCount})
          </button>
          <button
            onClick={() => setPopulatedOnly(true)}
            className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              populatedOnly
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Has Data ({populatedCount})</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`cursor-pointer px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#9146FF] text-white font-bold'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedCategory(c.name)}
              className={`cursor-pointer px-2 py-0.5 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
                selectedCategory.toLowerCase() === c.name.toLowerCase()
                  ? 'bg-[#9146FF] text-white font-bold'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{c.name}</span>
              {c.populatedCount !== undefined && c.populatedCount > 0 && (
                <span className="text-[9px] font-mono text-emerald-400 font-bold">
                  ({c.populatedCount})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tree Node List */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {tree.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">No matching files</div>
        ) : (
          tree.map((node) => renderTreeNode(node))
        )}
      </div>

      {/* Selected File Footer Info */}
      {selectedFile && !isOverviewSelected && (
        <div className="mt-2 pt-2.5 border-t border-white/10 text-xs shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
            Active Dataset
          </p>
          <div className="font-mono text-gray-200 truncate font-semibold">{selectedFile.name}</div>
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 mt-1">
            <span>{selectedFile.category}</span>
            <span className={selectedFile.isPopulated ? 'text-emerald-400 font-bold' : ''}>
              {selectedFile.isPopulated
                ? `${(selectedFile.rowCount || 0).toLocaleString()} rows`
                : '0 rows (empty)'}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
