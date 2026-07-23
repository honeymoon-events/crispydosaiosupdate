// services/orderService.js
import firestore from '@react-native-firebase/firestore';

/**
 * CREATE ORDER
 * Used in CheckoutScreen
 */
export const createOrder = async (orderData) => {
  try {
    const orderNumber = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    await firestore().collection('orders').add({ ...orderData, order_number: orderNumber,
      order_status: 1, created_at: firestore.FieldValue.serverTimestamp() });
    const cartSnapshot = await firestore().collection('carts')
      .where('customer_id', '==', String(orderData.customer_id)).get();
    const batch = firestore().batch();
    cartSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    return { status: 1, message: "Order placed successfully!" };
  } catch (err) {
    console.log("createOrder error:", err);
    return { status: 0, message: "Unable to place order" };
  }
};

/**
 * GET CUSTOMER ORDERS (ORDER HISTORY)
 * Backend: GET /orders/customer/:customer_id
 */
export const getOrders = async (customerId) => {
  try {
    const snapshot = await firestore().collection('orders')
      .where('customer_id', '==', String(customerId)).orderBy('created_at', 'desc').get();
    return { status: 1, data: snapshot.docs.map(doc => {
      const order = doc.data();
      return { id: doc.id, ...order,
        created_at: order.created_at?.toDate ? order.created_at.toDate().toISOString() : order.created_at };
    }) };
  } catch (err) {
    console.log("getOrders error:", err);
    return { status: 0, message: "Unable to fetch orders", data: [] };
  }
};

/**
 * GET SINGLE ORDER DETAILS
 * Backend: GET /orders/:order_id
 */
export const getOrder = async (orderId) => {
  try {
    const doc = await firestore().collection('orders').doc(orderId).get();
    if (!doc.exists) return { status: 0, message: "Order not found" };
    const order = doc.data();
    return { status: 1, data: { id: doc.id, ...order,
      created_at: order.created_at?.toDate ? order.created_at.toDate().toISOString() : order.created_at } };
  } catch (err) {
    console.log("getOrder error:", err);
    return { status: 0, message: "Unable to fetch order details" };
  }
};
