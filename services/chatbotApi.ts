import axios from "axios";

export interface ChatMessage {
    type: string;
  content: string;
}

export interface ChatRequestPayload {
  user_input: string;
  chat_history: ChatMessage[];
  user_id?: number;
}

export async function sendMessageToAgent(payload: ChatRequestPayload): Promise<string> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_LLM_AGENT_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "챗봇 응답 실패");
  }

  const data = await res.json();
  return data.response;
}

export interface DBChatMessage {
    id: number;
    user_id: number;
    sender: "user" | "bot";
    content: string;
    timestamp: string;
}
  
export interface ChatHistoryApiResponse {
    messages: DBChatMessage[];
}
  
export const fetchChatHistory = async (userId: number): Promise<ChatHistoryApiResponse> => {
    try {
        const response = await axios.get<ChatHistoryApiResponse>(`${process.env.NEXT_PUBLIC_LLM_AGENT_URL}/chat/history/${userId}`);
        
        // response.data가 null 또는 undefined일 경우를 대비하여 빈 배열을 반환합니다.
        return response.data || { messages: [] }; 
    } catch (error) {
        console.error("Failed to fetch chat history:", error);
        throw error;
    }
};
