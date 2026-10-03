const parseNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const isRestaurantDeliveryEnabled = (restaurant = {}) => {
  const delivery = restaurant?.delivery;
  return delivery === 1 || delivery === true || delivery === '1';
};

export const calculateHomeDeliveryFee = (restaurant = {}, distanceKm = 0, subtotal = 0) => {
  const orderSubtotal = parseNumber(subtotal, 0);
  const freeDeliveryAbove = parseNumber(
    restaurant?.free_delivery_above ?? restaurant?.freeDeliveryAbove ?? restaurant?.free_delivery_threshold ?? 0,
    0,
  );

  if (freeDeliveryAbove > 0 && orderSubtotal >= freeDeliveryAbove) {
    return 0;
  }

  const baseFee = parseNumber(
    restaurant?.base_delivery_fee ??
      restaurant?.delivery_charges ??
      restaurant?.delivery_fee ??
      restaurant?.deliveryFee ??
      restaurant?.delivery_charge ??
      restaurant?.deliveryCharge ??
      restaurant?.delivery_cost ??
      restaurant?.deliveryCost ??
      restaurant?.delivery_price ??
      restaurant?.deliveryPrice ??
      0,
    0,
  );

  const includedDistance = parseNumber(
    restaurant?.base_delivery_distance ??
      restaurant?.base_distance ??
      restaurant?.delivery_radius ??
      restaurant?.max_delivery_radius ??
      restaurant?.included_delivery_distance ??
      restaurant?.free_delivery_distance ??
      0,
    0,
  );

  const extraFeePerKm = parseNumber(
    restaurant?.extra_fee_per_km ??
      restaurant?.fee_per_km ??
      restaurant?.delivery_fee_per_km ??
      restaurant?.deliveryPerKm ??
      restaurant?.distance_fee ??
      restaurant?.per_km_fee ??
      0,
    0,
  );

  const currentDistance = parseNumber(distanceKm, 0);
  const distanceOverIncluded = Math.max(0, currentDistance - includedDistance);
  const fee = baseFee + (distanceOverIncluded * extraFeePerKm);

  return Number(fee.toFixed(2));
};
