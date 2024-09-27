export interface MessageType {
  id: number; 
  content: string | null;
  role: "user" | "system";
}