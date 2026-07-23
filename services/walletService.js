// services/walletService.js
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export const getWalletSummary = async () => {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error("Not logged in");
    const doc = await firestore().collection('customers').doc(user.uid).get();
    const data = doc.data() || {};
    const historySnap = await firestore().collection('wallet_transactions')
      .where('customer_id', '==', user.uid).get();
    const history = historySnap.docs.map(d => {
      const item = d.data();
      const date = item.created_at?.toDate ? item.created_at.toDate() : new Date(item.created_at || 0);
      const amount = Number(item.amount || 0).toFixed(2);
      return { id: d.id, ...item, raw_date: date,
        created_at: item.created_at?.toDate ? date.toLocaleString('en-US', { hour12: true, year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }) : item.created_at,
        amount: item.type === "debit" ? `-£${amount}` : `+£${amount}` };
    }).sort((a, b) => b.raw_date - a.raw_date);
    return { wallet_balance: data.wallet_balance || 0, loyalty_points: data.loyalty_points || 0,
      loyalty_pending_points: 0, loyalty_pending_list: [],
      loyalty_expiry_list: data.loyalty_points >= 10 ? [{ credit_value: Math.floor(data.loyalty_points / 10), expires_at: new Date(Date.now() + 31536000000).toISOString() }] : [],
      referral_credits: data.referral_credits || 0, history, loyalty_redeem_points: 10,
      loyalty_redeem_value: 1, loyalty_available_after_hours: 0 };
  } catch (err) {
    console.log("getWalletSummary error:", err);
    return null;
    return {
      wallet_balance: 0,
      loyalty_points: 0,
      loyalty_pending_points: 0,
      loyalty_pending_list: [],
      referral_credits: 0,
      history: [],
      loyalty_redeem_points: 10,
      loyalty_redeem_value: 1,
      loyalty_available_after_hours: 24,
    };
  }
};

export const redeemLoyaltyToWallet = async () => {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error("Not logged in");
    const ref = firestore().collection('customers').doc(user.uid);
    await firestore().runTransaction(async transaction => {
      const doc = await transaction.get(ref);
      const data = doc.data() || {};
      const points = data.loyalty_points || 0;
      if (points < 10) throw new Error("Not enough points");
      const amount = Math.floor(points / 10);
      transaction.update(ref, { loyalty_points: points % 10, wallet_balance: (data.wallet_balance || 0) + amount });
      transaction.set(firestore().collection('wallet_transactions').doc(), { customer_id: user.uid,
        amount, type: "credit", description: `Redeemed ${points - points % 10} loyalty points`, created_at: firestore.FieldValue.serverTimestamp() });
    });
    return { status: 1, message: "Redeemed successfully!" };
  } catch (err) {
    console.log("redeemLoyaltyToWallet error:", err);
    return { status: 0, message: "Redeem failed" };
  }
};
