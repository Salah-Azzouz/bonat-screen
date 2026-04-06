export interface ApiResponse<T> {
  code: number;
  data: T;
  errors?: string[];
}
