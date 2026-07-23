import firestore from '@react-native-firebase/firestore';
import { resolveImageSource } from '../utils/imageHelpers';

export const fetchProducts = async (userId, categoryId) => {
  try {
    const snapshot = await firestore().collection('products')
      .where('user_id', 'in', [Number(userId), String(userId)])
      .where('cat_id', '==', String(categoryId)).get();
    return snapshot.docs.map(doc => {
          const product = doc.data();
          let c = product.contains;
          try {
            if (typeof c === 'string') c = JSON.parse(c);
            if (typeof c === 'string') c = JSON.parse(c);
          } catch (e) {}

          console.log('[Image debug][product]', product.image || product.product_image || product.image_url || '');
          const imageSource = resolveImageSource(product.image || product.product_image || product.image_url || '');

          return {
            id: doc.id,
            ...product,
            name: product.name || product.product_name || "Unknown Product",
            contains: Array.isArray(c) ? c : [],
            restaurantId: product.user_id,
            sort_order: Number(product.sort_order || 0),
            image: imageSource?.uri || '',
          };
        }).sort((a, b) => a.sort_order - b.sort_order);
  } catch (err) {
    console.log("Product Firestore Error:", err);
    return [];
  }
};
