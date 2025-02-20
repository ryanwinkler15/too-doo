export interface Note {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  is_priority?: boolean;
  is_list?: boolean;
  label?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export interface Label {
  id: string;
  name: string;
  color: string;
} 