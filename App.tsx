import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Menu, 
  X,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { PromptCard } from './components/PromptCard';
import { Modal } from './components/Modal';
import { Button } from './components/Button';
import { SYSTEM_FOLDERS, Folder, Prompt, ViewMode } from './types';
import { generateId, cn } from './utils';
import { ToastContainer, toast } from 'react-toastify';

// --- Local Storage Hooks ---
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

export default function App() {
  // --- State ---
  const [folders, setFolders] = useLocalStorage<Folder[]>('folders', []);
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>('prompts', []);
  const [activeFolderId, setActiveFolderId] = useState<string>(SYSTEM_FOLDERS.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null); // For editing
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null); // For editing folder
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [promptToMove, setPromptToMove] = useState<Prompt | null>(null);

  // Form States (Simple controlled inputs for modals)
  const [promptForm, setPromptForm] = useState({ title: '', content: '', tags: '' });
  const [folderForm, setFolderForm] = useState({ name: '' });


  // --- Logic ---
  
  // Filtering
  const filteredPrompts = useMemo(() => {
    let filtered = prompts;

    // Folder Filter
    if (activeFolderId === SYSTEM_FOLDERS.TRASH) {
      filtered = filtered.filter(p => p.isDeleted);
    } else {
      // Show non-deleted items
      filtered = filtered.filter(p => !p.isDeleted);

      if (activeFolderId === SYSTEM_FOLDERS.FAVORITES) {
        filtered = filtered.filter(p => p.isFavorite);
      } else if (activeFolderId !== SYSTEM_FOLDERS.ALL) {
        filtered = filtered.filter(p => p.folderId === activeFolderId);
      }
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.content.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort by updated newest first
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [prompts, activeFolderId, searchQuery]);

  const activeFolderName = useMemo(() => {
    if (activeFolderId === SYSTEM_FOLDERS.ALL) return 'All Prompts';
    if (activeFolderId === SYSTEM_FOLDERS.FAVORITES) return 'Favorites';
    if (activeFolderId === SYSTEM_FOLDERS.TRASH) return 'Trash';
    return folders.find(f => f.id === activeFolderId)?.name || 'Unknown Folder';
  }, [activeFolderId, folders]);

  // --- Handlers ---

  // Prompt CRUD
  const handleSavePrompt = () => {
    if (!promptForm.title.trim() || !promptForm.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    const tags = promptForm.tags.split(',').map(t => t.trim()).filter(t => t);

    if (currentPrompt) {
      // Update
      setPrompts(prev => prev.map(p => p.id === currentPrompt.id ? {
        ...p,
        title: promptForm.title,
        content: promptForm.content,
        tags,
        updatedAt: Date.now()
      } : p));
      toast.success("Prompt updated!");
    } else {
      // Create
      const newPrompt: Prompt = {
        id: generateId(),
        title: promptForm.title,
        content: promptForm.content,
        tags,
        folderId: activeFolderId === SYSTEM_FOLDERS.ALL || activeFolderId === SYSTEM_FOLDERS.FAVORITES ? SYSTEM_FOLDERS.ALL : activeFolderId, // Default to current or global if in system view
        isFavorite: false,
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setPrompts(prev => [newPrompt, ...prev]);
      toast.success("Prompt created!");
    }
    closePromptModal();
  };

  const handleDeletePrompt = (id: string) => {
    if (activeFolderId === SYSTEM_FOLDERS.TRASH) {
      // Permanent delete
      if(window.confirm("Are you sure you want to permanently delete this prompt?")) {
        setPrompts(prev => prev.filter(p => p.id !== id));
        toast.success("Permanently deleted.");
      }
    } else {
      // Soft delete
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, isDeleted: true } : p));
      toast.success("Moved to Trash.");
    }
  };

  const handleRestorePrompt = (id: string) => {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, isDeleted: false } : p));
    toast.success("Restored from Trash.");
  }

  const handleToggleFavorite = (id: string) => {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.info("Copied to clipboard!");
  };

  // Folder CRUD
  const handleSaveFolder = () => {
    if (!folderForm.name.trim()) return;

    if (currentFolder) {
      setFolders(prev => prev.map(f => f.id === currentFolder.id ? { ...f, name: folderForm.name } : f));
      toast.success("Folder renamed.");
    } else {
      const newFolder: Folder = {
        id: generateId(),
        name: folderForm.name,
      };
      setFolders(prev => [...prev, newFolder]);
      toast.success("Folder created.");
    }
    closeFolderModal();
  };

  const handleDeleteFolder = (id: string) => {
    if (window.confirm("Delete this folder? Prompts inside will be moved to 'All Prompts' (Trash if deleted).")) {
      setFolders(prev => prev.filter(f => f.id !== id));
      // Move prompts in this folder to 'All' (which effectively means just unsetting folderId if we treated 'all' as null, but here we treat folderId as just a string. 
      // If folder is gone, we should probably set their folderId to 'all' or let them be orphans appearing in All. 
      // Current logic: Prompts have folderId. If folder deleted, set folderId to SYSTEM_FOLDERS.ALL.
      setPrompts(prev => prev.map(p => p.folderId === id ? { ...p, folderId: SYSTEM_FOLDERS.ALL } : p));
      
      if (activeFolderId === id) setActiveFolderId(SYSTEM_FOLDERS.ALL);
      toast.success("Folder deleted.");
    }
  };

  // Move Logic
  const handleMovePrompt = (folderId: string) => {
    if (promptToMove) {
      setPrompts(prev => prev.map(p => p.id === promptToMove.id ? { ...p, folderId } : p));
      toast.success(`Moved to folder.`);
      setIsMoveModalOpen(false);
      setPromptToMove(null);
    }
  };

  const handleDropPrompt = (promptId: string, targetFolderId: string) => {
      setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, folderId: targetFolderId, isDeleted: targetFolderId === SYSTEM_FOLDERS.TRASH } : p));
      toast.success(`Moved successfully.`);
  }

  // Modal Helpers
  const openPromptModal = (prompt?: Prompt) => {
    if (prompt) {
      setCurrentPrompt(prompt);
      setPromptForm({ title: prompt.title, content: prompt.content, tags: prompt.tags.join(', ') });
    } else {
      setCurrentPrompt(null);
      setPromptForm({ title: '', content: '', tags: '' });
    }
    setIsPromptModalOpen(true);
  };

  const closePromptModal = () => setIsPromptModalOpen(false);

  const openFolderModal = (folder?: Folder) => {
    if (folder) {
      setCurrentFolder(folder);
      setFolderForm({ name: folder.name });
    } else {
      setCurrentFolder(null);
      setFolderForm({ name: '' });
    }
    setIsFolderModalOpen(true);
  };
  
  const closeFolderModal = () => setIsFolderModalOpen(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans">
      <ToastContainer position="bottom-right" autoClose={2000} hideProgressBar theme="light" />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar 
          folders={folders}
          activeFolderId={activeFolderId}
          onSelectFolder={(id) => { setActiveFolderId(id); setIsMobileMenuOpen(false); }}
          onCreateFolder={() => openFolderModal()}
          onEditFolder={(f) => openFolderModal(f)}
          onDeleteFolder={handleDeleteFolder}
          onDropPrompt={handleDropPrompt}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3 flex-1">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-500"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 hidden sm:block truncate max-w-[200px]">
              {activeFolderName}
            </h2>
            
            {/* Search Bar */}
            <div className="relative max-w-md w-full ml-2 sm:ml-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-4">
            <div className="hidden sm:flex bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700")}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
            
            <Button onClick={() => openPromptModal()}>
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Prompt</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </header>

        {/* Prompts Grid */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 sm:pb-20">
          {filteredPrompts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-500">No prompts found</p>
              <p className="text-sm">Try creating a new one or changing filters.</p>
              <Button variant="outline" className="mt-4" onClick={() => openPromptModal()}>
                Create Prompt
              </Button>
            </div>
          ) : (
            <div className={cn(
              "grid gap-4 sm:gap-6",
              viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1"
            )}>
              {filteredPrompts.map(prompt => (
                <PromptCard 
                  key={prompt.id}
                  prompt={prompt}
                  isTrash={activeFolderId === SYSTEM_FOLDERS.TRASH}
                  onEdit={openPromptModal}
                  onDelete={handleDeletePrompt}
                  onCopy={handleCopy}
                  onToggleFavorite={handleToggleFavorite}
                  onMove={(p) => { setPromptToMove(p); setIsMoveModalOpen(true); }}
                  onRestore={handleRestorePrompt}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* --- Modals --- */}

      {/* Prompt Editor Modal */}
      <Modal
        isOpen={isPromptModalOpen}
        onClose={closePromptModal}
        title={currentPrompt ? "Edit Prompt" : "Create New Prompt"}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="e.g., Coding Assistant System Prompt"
              value={promptForm.title}
              onChange={(e) => setPromptForm({...promptForm, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
            <textarea 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[200px] font-mono text-sm leading-relaxed"
              placeholder="Enter your prompt here..."
              value={promptForm.content}
              onChange={(e) => setPromptForm({...promptForm, content: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="coding, react, writing"
              value={promptForm.tags}
              onChange={(e) => setPromptForm({...promptForm, tags: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={closePromptModal}>Cancel</Button>
            <Button onClick={handleSavePrompt}>{currentPrompt ? 'Save Changes' : 'Create Prompt'}</Button>
          </div>
        </div>
      </Modal>

      {/* Folder Editor Modal */}
      <Modal
        isOpen={isFolderModalOpen}
        onClose={closeFolderModal}
        title={currentFolder ? "Edit Folder" : "New Folder"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Folder Name</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="e.g., Work Projects"
              value={folderForm.name}
              onChange={(e) => setFolderForm({...folderForm, name: e.target.value})}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={closeFolderModal}>Cancel</Button>
            <Button onClick={handleSaveFolder}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Move Prompt Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        title="Move to Folder"
      >
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <button
            className={cn(
               "w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-3",
               promptToMove?.folderId === SYSTEM_FOLDERS.ALL && "bg-indigo-50 text-indigo-700"
            )}
            onClick={() => handleMovePrompt(SYSTEM_FOLDERS.ALL)}
          >
             <LayoutGrid className="w-4 h-4 text-slate-400" />
             <span className="font-medium">All Prompts (Uncategorized)</span>
          </button>
          
          <div className="h-px bg-slate-100 my-2" />

          {folders.length === 0 && (
             <p className="text-center text-slate-400 py-4 text-sm">No folders created yet.</p>
          )}

          {folders.map(folder => (
            <button
              key={folder.id}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-3",
                promptToMove?.folderId === folder.id && "bg-indigo-50 text-indigo-700"
              )}
              onClick={() => handleMovePrompt(folder.id)}
            >
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                {folder.name.charAt(0).toUpperCase()}
              </span>
              <span className="font-medium truncate">{folder.name}</span>
            </button>
          ))}
        </div>
      </Modal>

    </div>
  );
}