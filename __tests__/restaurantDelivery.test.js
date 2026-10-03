import { isRestaurantDeliveryEnabled, calculateHomeDeliveryFee } from '../utils/restaurantDelivery';

describe('restaurant delivery flag', () => {
  it('returns true for numeric, boolean, and string values of 1', () => {
    expect(isRestaurantDeliveryEnabled({ delivery: 1 })).toBe(true);
    expect(isRestaurantDeliveryEnabled({ delivery: true })).toBe(true);
    expect(isRestaurantDeliveryEnabled({ delivery: '1' })).toBe(true);
  });

  it('returns false for disabled or missing values', () => {
    expect(isRestaurantDeliveryEnabled({ delivery: 0 })).toBe(false);
    expect(isRestaurantDeliveryEnabled({ delivery: false })).toBe(false);
    expect(isRestaurantDeliveryEnabled({ delivery: '0' })).toBe(false);
    expect(isRestaurantDeliveryEnabled({})).toBe(false);
  });
});

describe('home delivery fee calculation', () => {
  it('uses a base fee when no distance-based charge is present', () => {
    expect(calculateHomeDeliveryFee({ base_delivery_fee: 2.5 })).toBe(2.5);
  });

  it('adds a distance-based charge beyond the included distance', () => {
    expect(calculateHomeDeliveryFee({
      base_delivery_fee: 2.5,
      extra_fee_per_km: 0.75,
      base_delivery_distance: 3,
    }, 6.5)).toBeCloseTo(5.13, 2);
  });

  it('returns zero when the order qualifies for free delivery', () => {
    expect(calculateHomeDeliveryFee({
      base_delivery_fee: 3.5,
      free_delivery_above: 30,
    }, 2, 35)).toBe(0);
  });
});
