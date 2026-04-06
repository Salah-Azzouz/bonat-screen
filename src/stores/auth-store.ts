import { create } from 'zustand';
import type { Merchant } from '@/types/merchant';
import type { Branch } from '@/types/branch';
import { STORAGE_KEYS } from '@/lib/constants';

interface AuthState {
  token: string | null;
  merchant: Merchant | null;
  selectedBranch: Branch | null;
  deviceName: string;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setAuth: (token: string, merchant: Merchant) => void;
  setMerchant: (merchant: Merchant) => void;
  setBranch: (branch: Branch, deviceName: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  merchant: null,
  selectedBranch: null,
  deviceName: '',
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (token, merchant) => {
    localStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.ALL_USER_DATA, JSON.stringify(merchant));
    localStorage.setItem(STORAGE_KEYS.ID_MERCHANT, merchant.idMerchant);
    localStorage.setItem(STORAGE_KEYS.CHECK_STATUS, 'true');
    set({ token, merchant, isAuthenticated: true });
  },

  setMerchant: (merchant) => {
    localStorage.setItem(STORAGE_KEYS.ALL_USER_DATA, JSON.stringify(merchant));
    set({ merchant });
  },

  setBranch: (branch, deviceName) => {
    localStorage.setItem(STORAGE_KEYS.BRANCH_SELECTED, JSON.stringify(branch));
    localStorage.setItem(STORAGE_KEYS.DEVICE_NAME, deviceName);
    set({ selectedBranch: branch, deviceName });
  },

  logout: () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    set({
      token: null,
      merchant: null,
      selectedBranch: null,
      deviceName: '',
      isAuthenticated: false,
    });
  },

  hydrate: () => {
    const token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    const checkStatus = localStorage.getItem(STORAGE_KEYS.CHECK_STATUS);
    const merchantStr = localStorage.getItem(STORAGE_KEYS.ALL_USER_DATA);
    const branchStr = localStorage.getItem(STORAGE_KEYS.BRANCH_SELECTED);
    const deviceName = localStorage.getItem(STORAGE_KEYS.DEVICE_NAME) || '';

    let merchant: Merchant | null = null;
    let selectedBranch: Branch | null = null;

    try {
      if (merchantStr) merchant = JSON.parse(merchantStr);
    } catch {}
    try {
      if (branchStr) selectedBranch = JSON.parse(branchStr);
    } catch {}

    set({
      token,
      merchant,
      selectedBranch,
      deviceName,
      isAuthenticated: !!token && checkStatus === 'true',
      isHydrated: true,
    });
  },
}));
