export interface Note {
  id: string;
  title: string;
  description: string;
  label?: Label;
  due_date?: string;
  is_completed?: boolean;
  completed_at?: string;
  is_priority?: boolean;
  is_list?: boolean;
  position?: number;
  created_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  position?: number;
} 