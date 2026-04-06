export interface Branch {
  idBranch: string;
  idMerchant: string;
  idCity: string;
  lat: string;
  lng: string;
  workingHours: string;
  district: string;
  posIdBranch: string;
  posIdBranch_branch?: string;
  posIdProduct: string;
  [key: string]: unknown; // allow extra fields from API
}
