import firestore from '@react-native-firebase/firestore';

const getSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/^http:\/\//i, 'https://').replace(/ /g, '%20');
};export const fetchCategories = async (userId) => {
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