import storage from '@react-native-firebase/storage';
import { IMAGE_BASE_URL } from '../config/baseURL';

const normalizeImageUrl = (value) => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:') || trimmed.startsWith('file://') || trimmed.startsWith('content://')) {
    return trimmed;
  }

  if (/^(https?:)?\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('gs://')) {
    return trimmed;
  }

  const base = IMAGE_BASE_URL.replace(/\/+$/, '');
  const cleaned = trimmed.replace(/^\/+/, '');
  const normalizedPath = cleaned.startsWith('uploads/')
    ? cleaned.replace(/^uploads\//, '')
    : cleaned;

  return `${base}/${normalizedPath}`;
};

export const resolveImageSource = (value, fallbackSource = null) => {
  if (!value) {
    return fallbackSource;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    if (typeof value.uri === 'string') {
      return {
        ...value,
        uri: normalizeImageUrl(value.uri),
      };
    }

    return value;
  }

  if (typeof value === 'string') {
    const normalizedUri = normalizeImageUrl(value);
    return normalizedUri ? { uri: normalizedUri } : fallbackSource;
  }

  return fallbackSource;
};

export const resolveFirebaseStorageUrl = async (value, fallbackSource = null) => {
  if (typeof value !== 'string' || !value.trim()) {
    return fallbackSource;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('gs://')) {
    try {
      const ref = trimmed.startsWith('gs://') ? storage().refFromURL(trimmed) : storage().ref(trimmed);
      const downloadUrl = await ref.getDownloadURL();
      return { uri: downloadUrl };
    } catch (error) {
      console.warn('Failed to resolve Firebase Storage image', error);
      return fallbackSource;
    }
  }

  return resolveImageSource(value, fallbackSource);
};
