import firestore from '@react-native-firebase/firestore';
import { resolveImageSource } from '../utils/imageHelpers';

export const fetchCategories = async (userId) => {
  try {
    const snapshot = await firestore().collection('categories')
      .where('user_id', 'in', [Number(userId), String(userId)]).get();
    return snapshot.docs.map(doc => {
      const cat = doc.data();
      console.log('[Image debug][category]', cat.category_image || cat.image || '');
      const imageSource = resolveImageSource(cat.category_image || cat.image || '');
      return { id: doc.id, userId: cat.user_id, name: cat.name,
        image: imageSource?.uri || '', sort_order: Number(cat.sort_order || 0) };
    }).sort((a, b) => a.sort_order - b.sort_order);
  } catch (error) {
    console.error("Category Firestore Error:", error);
    return [];
  }
};

