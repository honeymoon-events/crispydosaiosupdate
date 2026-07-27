import firestore from '@react-native-firebase/firestore';

const IMAGE_BASE_URL = "https://api.crispydosa.info/uploads";

const getSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('file://') || trimmed.startsWith('content://')) return trimmed;

  let finalUrl = trimmed;
  if (!/^(https?:)?\/\//i.test(trimmed) && !trimmed.startsWith('gs://')) {
    const base = IMAGE_BASE_URL.replace(/\/+$/, '');
    const cleaned = trimmed.replace(/^\/+/, '');
    const normalizedPath = cleaned.startsWith('uploads/') ? cleaned.replace(/^uploads\//, '') : cleaned;
    finalUrl = `${base}/${normalizedPath}`;
  }

  try { return encodeURI(decodeURI(finalUrl)); } catch (e) { return encodeURI(finalUrl); }
};

export const fetchCategories = async (userId) => {
  try {
    const snapshot = await firestore().collection('categories')
      .where('user_id', 'in', [Number(userId), String(userId)]).get();
    return snapshot.docs.map(doc => {
      const cat = doc.data();
      return { 
        id: doc.id, 
        userId: cat.user_id, 
        name: cat.name,
        image: getSafeUrl(cat.category_image || cat.image), 
        sort_order: Number(cat.sort_order || 0) 
      };
    }).sort((a, b) => a.sort_order - b.sort_order);
  } catch (error) {
    console.error("Category Firestore Error:", error);
    return [];
  }
};