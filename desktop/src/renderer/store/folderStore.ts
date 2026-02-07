import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface FolderStats {
  id: string;
  name: string;
  deviceCount: number;
  onlineCount: number;
  offlineCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface FolderState {
  folders: FolderStats[];
  selectedFolderId: string | null;
  isLoading: boolean;
  error: string | null;

  setFolders: (folders: FolderStats[]) => void;
  setSelectedFolderId: (folderId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<Folder | null>;
  updateFolder: (id: string, name: string) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<boolean>;
  moveDeviceToFolder: (deviceId: string, folderId: string | null) => Promise<boolean>;
}

export const useFolderStore = create<FolderState>()((set, get) => ({
  folders: [],
  selectedFolderId: null,
  isLoading: false,
  error: null,

  setFolders: (folders) => set({ folders }),
  setSelectedFolderId: (folderId) => set({ selectedFolderId: folderId }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  fetchFolders: async () => {
    const { token, serverUrl } = useAuthStore.getState();
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${serverUrl}/folders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }

      const folders = await response.json();
      set({ folders, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createFolder: async (name: string) => {
    const { token, serverUrl } = useAuthStore.getState();
    if (!token) return null;

    try {
      const response = await fetch(`${serverUrl}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      const folder = await response.json();
      await get().fetchFolders();
      return folder;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  updateFolder: async (id: string, name: string) => {
    const { token, serverUrl } = useAuthStore.getState();
    if (!token) return null;

    try {
      const response = await fetch(`${serverUrl}/folders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to update folder');
      }

      const folder = await response.json();
      await get().fetchFolders();
      return folder;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  deleteFolder: async (id: string) => {
    const { token, serverUrl } = useAuthStore.getState();
    if (!token) return false;

    try {
      const response = await fetch(`${serverUrl}/folders/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete folder');
      }

      const { selectedFolderId } = get();
      if (selectedFolderId === id) {
        set({ selectedFolderId: null });
      }

      await get().fetchFolders();
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  moveDeviceToFolder: async (deviceId: string, folderId: string | null) => {
    const { token, serverUrl } = useAuthStore.getState();
    if (!token) return false;

    try {
      const response = await fetch(`${serverUrl}/devices/${deviceId}/folder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to move device');
      }

      await get().fetchFolders();
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },
}));
