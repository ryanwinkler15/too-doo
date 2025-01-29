export interface Note {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  is_priority?: boolean;
  label?: {
    id: string;
    name: string;
    color: string;
  } | null;
} 