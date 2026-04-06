export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://stg-api.bonat.io/merchant/v2';

export const FIREBASE_FUNCTIONS_URL =
  process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ||
  'https://us-central1-bonatdev.cloudfunctions.net';

export const ENDPOINTS = {
  login: `${API_BASE_URL}/login`,
  allBranches: `${API_BASE_URL}/allbranch`,
  merchant: `${API_BASE_URL}/merchant`,
  campaignByCouponId: `${API_BASE_URL}/campaignByCouponId`,
  postReceipt: `${API_BASE_URL}/postReceipt`,
  postSquareOrder: `${API_BASE_URL}/postSquareOrder`,
  usedCoupon: `${API_BASE_URL}/usedCoupon`,
  createOrder: `${FIREBASE_FUNCTIONS_URL}/createOrder`,
  updateOrder: `${FIREBASE_FUNCTIONS_URL}/updateOrder`,
} as const;

export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  ALL_USER_DATA: 'allUserData',
  ID_MERCHANT: 'idMerchant',
  CHECK_STATUS: 'checkStatus',
  BRANCH_SELECTED: 'branchSelected',
  DEVICE_NAME: 'deviceName',
  MERCHANT_IMAGE: 'merchant_image',
} as const;

export const COLORS = {
  orange: '#FF7746',
  pink: '#E54A92',
  bg: '#f9f6f8',
  green: '#4CAF50',
  yellow: '#fac05e',
  gray: '#707070',
  lightGray: '#f9f9f9',
  white: '#ffffff',
  black: '#000000',
} as const;
