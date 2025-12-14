import React from 'react';
import { 
  Copy, 
  Trash2, 
  Edit3, 
  Star, 
  FolderInput,
  RotateCcw
} from 'lucide-react';
import { Prompt, SYSTEM_FOLDERS } from '../types';
import { formatDate, cn } from '../utils';
import { Button } from './Button';

interface PromptCardProps {
  prompt: Prompt;
  isTrash: boolean;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
  onToggleFavorite: (id: string) => void;
  onMove: (prompt: Prompt) => void;
  onRestore: (id: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  isTrash,
  onEdit,
  onDelete,
  onCopy,
  onToggleFavorite,
  onMove,
  onRestore
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('promptId', prompt.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className={cn(
        "group relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-indigo-200 flex flex-col h-[280px]",
        isTrash && "opacity-75 bg-slate-50"
      )}
      draggable={!isTrash}
      onDragStart={handleDragStart}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-800 truncate pr-8 flex-1" title={prompt.title}>
          {prompt.title}
        </h3>
        {!isTrash && (
           <button 
             onClick={() => onToggleFavorite(prompt.id)}
             className={cn(
               "absolute top-5 right-5 p-1 rounded-full transition-colors",
               prompt.isFavorite ? "text-amber-400 bg-amber-50" : "text-slate-300 hover:text-slate-400"
             )}
           >
             <Star className={cn("w-5 h-5", prompt.isFavorite && "fill-current")} />
           </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative mb-4">
        <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed line-clamp-6 font-mono bg-slate-50 p-2 rounded-md h-full border border-slate-100">
          {prompt.content}
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
      </div>

      <div className="mt-auto">
        <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar">
          {prompt.tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 whitespace-nowrap border border-indigo-100">
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            {formatDate(prompt.updatedAt)}
          </span>
          
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            {isTrash ? (
              <>
                 <Button variant="ghost" size="icon" onClick={() => onRestore(prompt.id)} title="Restore">
                  <RotateCcw className="w-4 h-4 text-emerald-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(prompt.id)} title="Delete Permanently">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={() => onCopy(prompt.content)} title="Copy Content">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onMove(prompt)} title="Move to Folder">
                  <FolderInput className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(prompt)} title="Edit">
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(prompt.id)} title="Delete">
                  <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
