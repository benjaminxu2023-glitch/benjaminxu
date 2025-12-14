export interface Folder {
  id: string;
  name: string;
  isSystem?: boolean; // For 'All', 'Trash', 'Favorites'
  icon?: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  folderId: string; // The ID of the folder it belongs to. If deleted, it might go to a 'trash' logic ID.
  isFavorite: boolean;
  isDeleted: boolean; // Soft delete
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export type ViewMode = 'grid' | 'list';

export const SYSTEM_FOLDERS = {
  ALL: 'all',
  FAVORITES: 'favorites',
  TRASH: 'trash',
};
