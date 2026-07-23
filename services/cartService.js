import firestore from '@react-native-firebase/firestore';

// Add or update cart item (quantity change or notes update)
export const addToCart = async (cartData) => {
  try {
    /**
     cartData must include:
     - customer_id
     - user_id
     - product_id
     - restaurant_id
     - product_name
     - product_price
     - product_tax
     - product_quantity  (delta: +1, -1)
     - textfield (notes)
    */

    const custId = String(cartData.customer_id);
    const cartRef = firestore().collection('carts');
    const snapshot = await cartRef.where('customer_id', '==', custId)
      .where('product_id', '==', String(cartData.product_id))
      .where('textfield', '==', cartData.textfield || "").get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const newQty = doc.data().product_quantity + cartData.product_quantity;
      if (newQty <= 0) await cartRef.doc(doc.id).delete();
      else await cartRef.doc(doc.id).update({ product_quantity: newQty });
    } else if (cartData.product_quantity > 0) {
      await cartRef.add({ ...cartData, customer_id: custId,
        product_id: String(cartData.product_id), created_at: firestore.FieldValue.serverTimestamp() });
    }
    return { status: 1, message: "Cart updated" };
  } catch (err) {
    console.log("Add to Cart Error:", err);
    return { status: 0, message: "Firestore Error" };
  }
};

// Get full cart for a user
export const getCart = async (customerId) => {
  try {
    const snapshot = await firestore().collection('carts')
      .where('customer_id', '==', String(customerId)).get();
    return { status: 1, data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
  } catch (err) {
    console.log("Get Cart Error:", err);
    return { status: 0, data: [] };
  }
};

// Remove item from cart
export const removeFromCart = async (cartId) => {
  try {
    await firestore().collection('carts').doc(cartId).delete();
    return { status: 1, message: "Item removed" };
  } catch (err) {
    console.log("Remove Cart Error:", err);
    return { status: 0, message: "Firestore Error" };
  }
};
