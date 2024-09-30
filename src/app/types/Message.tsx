// export interface MessageType {
//   id: number; 
//   content: string | null;
//   parent_id?: number;
//   role: "user" | "system";
// }

interface Response {
  id: string;
  content: string;
}

interface Branch {
  id: string;
  content: string;
  threadLevel: number;
  response: Response;
}
interface Message {
  id: string;
  branches: Branch[];
}