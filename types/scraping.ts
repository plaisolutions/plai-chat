export interface ScrapingStatus {
  resource_id: string;
  links_count: number;
  done: number;
  in_progress: number;
  failed: number;
}