import React, { useState } from 'react';
import { 
  Folder, 
  Trash2, 
  Star, 
  LayoutGrid, 
  Plus, 
  MoreVertical,
  Pencil,
  Archive,
  Menu
} from 'lucide-react';
import { cn } from '../utils';
import { Folder as FolderType, SYSTEM_FOLDERS } from '../types';

interface SidebarProps {
  folders: FolderType[];
  activeFolderId: string;
  onSelectFolder: (id: string) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: FolderType) => void;
  onDeleteFolder: (id: string) => void;
  onDropPrompt: (promptId: string, folderId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onDropPrompt
}) => {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-indigo-50', 'border-indigo-200');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-indigo-50', 'border-indigo-200');
  };

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-indigo-50', 'border-indigo-200');
    const promptId = e.dataTransfer.getData('promptId');
    if (promptId) {
      onDropPrompt(promptId, folderId);
    }
  };

  const renderNavItem = (id: string, label: string, icon: React.ReactNode, isSystem = false) => {
    const isActive = activeFolderId === id;
    
    return (
      <div 
        key={id}
        className={cn(
          "group flex items-center justify-between px-3 py-2 rounded-md mb-1 cursor-pointer transition-colors border border-transparent",
          isActive ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
        onClick={() => onSelectFolder(id)}
        onDragOver={!isSystem || id === SYSTEM_FOLDERS.TRASH ? (e) => handleDragOver(e, id) : undefined}
        onDragLeave={!isSystem || id === SYSTEM_FOLDERS.TRASH ? handleDragLeave : undefined}
        onDrop={!isSystem || id === SYSTEM_FOLDERS.TRASH ? (e) => handleDrop(e, id) : undefined}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <span className={cn(isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500")}>
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>

        {!isSystem && (
           <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
             <button 
               className="p-1 hover:bg-slate-200 rounded"
               onClick={(e) => {
                 e.stopPropagation();
                 const folder = folders.find(f => f.id === id);
                 if (folder) onEditFolder(folder);
               }}
             >
               <Pencil className="w-3.5 h-3.5 text-slate-500" />
             </button>
             <button 
                className="p-1 hover:bg-red-100 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolder(id);
                }}
             >
               <Trash2 className="w-3.5 h-3.5 text-red-500" />
             </button>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full flex-shrink-0">
      <div className="p-4 flex items-center gap-2 border-b border-slate-200/50">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Archive className="text-white w-5 h-5" />
        </div>
        <h1 className="font-bold text-lg text-slate-800 tracking-tight">PromptMaster</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Library</h3>
          {renderNavItem(SYSTEM_FOLDERS.ALL, 'All Prompts', <LayoutGrid className="w-4 h-4" />, true)}
          {renderNavItem(SYSTEM_FOLDERS.FAVORITES, 'Favorites', <Star className="w-4 h-4" />, true)}
          {renderNavItem(SYSTEM_FOLDERS.TRASH, 'Trash', <Trash2 className="w-4 h-4" />, true)}
        </div>

        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Folders</h3>
            <button 
              onClick={onCreateFolder}
              className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500"
              title="New Folder"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-0.5">
            {folders.filter(f => !f.isSystem).map(folder => 
              renderNavItem(folder.id, folder.name, <Folder className="w-4 h-4" />)
            )}
            {folders.filter(f => !f.isSystem).length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-slate-400 italic">
                No folders yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 text-xs text-slate-400 text-center">
        v1.0.0 • Local Storage
      </div>
    </div>
  );
};
