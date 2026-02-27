/**
 * Application-wide constants for the Digital Voucher Ecosystem
 */

/** Seller QR refresh interval in milliseconds (10 minutes) */
export const SELLER_QR_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/** Seller nonce expiry in minutes */
export const SELLER_NONCE_EXPIRY_MINUTES = 10;

/** Clock drift allowance in seconds */
export const CLOCK_DRIFT_ALLOWANCE_SECONDS = 30;

/** P2P transfer nonce expiry in minutes */
export const P2P_NONCE_EXPIRY_MINUTES = 5;

/** Rate limit: max redemptions per vendor per minute */
export const MAX_REDEMPTIONS_PER_VENDOR_PER_MINUTE = 120;

/** Max PIN fallback attempts after biometric failure */
export const MAX_BIOMETRIC_FAILURES_BEFORE_PIN = 3;

/** API version prefix */
export const API_V1_PREFIX = 'api/v1';

/** Carbon footprint values (grams CO2e per serving) */
export const CARBON_FOOTPRINT = {
  BLACK_COFFEE: 21,
  COFFEE_DAIRY: 200,
  COFFEE_OAT_SOY: 60,
  GREEN_TEA: 15,
  REUSABLE_CUP_OFFSET: -30,
} as const;

/** Eco-Points modifiers */
export const ECO_POINTS = {
  BASELINE: 0,
  DAIRY_PENALTY: -5,
  OAT_SOY_BONUS: 10,
  GREEN_TEA_BONUS: 12,
  REUSABLE_CUP_BONUS: 15,
} as const;

/** Gamification constants */
export const GAMIFICATION = {
  DAILY_OPEN_POINTS: 5,
  PROFILE_COMPLETE_POINTS: 50,
  REFERRAL_POINTS: 30,
  P2P_GIFT_POINTS: 15,
  EARLY_BIRD_POINTS: 20,
  EARLY_BIRD_HOUR: 8,
  EARLY_BIRD_MINUTE: 30,
  STREAK_7_REWARD: 1, // 1 free coffee coupon
  STREAK_30_BADGE: 'COFFEE_ADDICT',
} as const;
