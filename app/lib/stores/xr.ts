import { atom } from 'nanostores';

const XR_MODE_KEY = 'xr_mode_enabled';
const isBrowser = typeof window !== 'undefined';

const loadInitial = (): boolean => {
  if (!isBrowser) return false;
  const stored = localStorage.getItem(XR_MODE_KEY);
  return stored ? JSON.parse(stored) : false;
};

export const xrMode = atom<boolean>(loadInitial());

export const toggleXRMode = () => {
  const next = !xrMode.get();
  xrMode.set(next);
  if (isBrowser) {
    localStorage.setItem(XR_MODE_KEY, JSON.stringify(next));
  }
};
