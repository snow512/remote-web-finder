export interface TreeItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  ignored: boolean;
  children?: TreeItem[];
}
