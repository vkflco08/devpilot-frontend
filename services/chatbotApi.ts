import { llmAgentApi } from "@/lib/axiosInstance";
import axios from "axios";

export interface ChatMessage {
    type: "human" | "ai" | "system" | "tool" | "user" | "bot" | "error";
    content: string;
    tool_calls?: Array<{ id: string; name: string; args: { [key: string]: any } }>; 
    tool_call_id?: string;
    name?: string;
}

export interface ChatRequestPayload {
  user_input: string;
  chat_history: ChatMessage[];
  user_id?: number;
}

export interface AgentResponse {
    response: string;
    full_chat_history: ChatMessage[];
}

export async function sendMessageToAgent(payload: ChatRequestPayload): Promise<AgentResponse> {
  try {
      const res = await llmAgentApi.post<AgentResponse>("/chat", payload);
      return res.data;
  } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
          const errorData = error.response.data;
          throw new Error(errorData.detail || errorData.message || "챗봇 응답 실패");
      }
      throw new Error(error.message || "알 수 없는 챗봇 응답 실패");
  }
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
        const response = await llmAgentApi.get<ChatHistoryApiResponse>(`${process.env.NEXT_PUBLIC_LLM_AGENT_URL}/chat/history/${userId}`);
        return response.data || { messages: [] }; 
    } catch (error) {
        console.error("Failed to fetch chat history:", error);
        throw error;
    }
};
