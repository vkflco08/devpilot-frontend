import { useState, useCallback, useEffect } from "react";
import { sendMessageToAgent, ChatMessage } from "@/services/chatbotApi"; 
import { fetchChatHistory } from "@/services/chatbotApi";
import { llmAgentApi } from "@/lib/axiosInstance";

export type Message = { 
  from: "user" | "bot";
  text: string;
  type: "human" | "ai" | "system" | "tool" | "user" | "bot" | "error";
  tool_calls?: Array<{ id: string; name: string; args: { [key: string]: any } }>;
  tool_call_id?: string;
  name?: string;
};

interface UseChatAgentReturn {
  messages: Message[];
  input: string;
  isLoading: boolean;
  setInput: (input: string) => void;
  handleSendMessage: () => Promise<void>;
  resetChat: () => void;
}

export const useChatAgent = (userId: number): UseChatAgentReturn => {
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: "안녕하세요! DevPilot 에이전트입니다. 무엇을 도와드릴까요?", type: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  // 에이전트 상태 확인 API
  const checkAgentHealth = useCallback(async () => {
    try {
      const response = await llmAgentApi.get(`/health`);
      if (response.data.status !== "ok") {
        throw new Error(`Agent is not healthy: ${response.data.message || response.statusText}`);
      }
      return true;
    } catch (error) {
      console.error("LLM Agent Health Check Failed:", error);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "❌ 에이전트 서버 연결에 문제가 발생했습니다.", type: "error" },
      ]);
      return false;
    }
  }, []);

  // 채팅 기록 로딩
  useEffect(() => {
    const loadChatHistory = async () => {
      setIsLoading(true);
      try {
        const historyResponse = await fetchChatHistory(userId);
        const chatMessages = historyResponse.messages || [];
        const loadedMessages: Message[] = chatMessages.map((msg) => ({
          from: msg.sender === "user" ? "user" : "bot",
          text: msg.content,
          type: msg.sender === "user" ? "user" : "bot",
        }));
        
        if (loadedMessages.length === 0) {
          setMessages([{ from: "bot", text: "안녕하세요! DevPilot 에이전트입니다. 무엇을 도와드릴까요?", type: "bot" }]);
        } else {
          const filteredLoadedMessages = loadedMessages.filter(msg => 
            msg.type !== "error" && !msg.text.includes("❌ 메시지 전송 중 오류 발생:")
          );
          setMessages(filteredLoadedMessages);
        }
        setHasLoadedHistory(true);
      } catch (error) {
        console.error("Failed to load chat history:", error);
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: "❌ 채팅 기록을 불러오는 데 실패했습니다.", type: "error" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && !hasLoadedHistory) {
      loadChatHistory();
    }
  }, [userId, hasLoadedHistory]);

  const handleSendMessage = useCallback(async () => {
    if (input.trim() === "" || isLoading) return;

    setIsLoading(true);

    const userMessageText = input;
    const newUserMessageForUI: Message = { from: "user", text: userMessageText, type: "user" }; 
    
    setMessages((prevMessages) => [...prevMessages, newUserMessageForUI]);
    setInput("");

    try {
      const isAgentHealthy = await checkAgentHealth();
      if (!isAgentHealthy) {
        setMessages((prev) => prev.slice(0, prev.length - 1).concat([
          { from: "bot", text: "❌ 에이전트 서버 연결에 문제가 발생했습니다.", type: "error" }
        ]));
        return;
      }

      const chatHistoryForAgent: ChatMessage[] = messages 
        .filter(msg => 
          msg.type !== "error" && 
          !(msg.type === "bot" && msg.text.includes("❌ 메시지 전송 중 오류 발생:"))
        ) 
        .map(msg => ({
          type: msg.type,
          content: msg.text,
          tool_calls: msg.tool_calls,
          tool_call_id: msg.tool_call_id,
          name: msg.name,
        }));
      
      const { response: botResponseText } = await sendMessageToAgent({
        user_input: userMessageText,
        chat_history: chatHistoryForAgent,
        user_id: userId,
      });

      setMessages((prevMessages) => {
        const updated = [...prevMessages];
        updated.push({ from: "bot", text: botResponseText, type: "ai" });
        return updated;
      });

    } catch (err: any) {
      console.error("Failed to send message to agent:", err);
      setMessages((prev) => {
        const stateWithoutOptimisticUserMessage = prev.slice(0, prev.length - 1);
        return [
          ...stateWithoutOptimisticUserMessage,
          { from: "bot", text: `❌ 메시지 전송 중 오류 발생: ${err.message}. 잠시 후 다시 시도해주세요.`, type: "error" },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, checkAgentHealth, userId]);

  const resetChat = useCallback(() => {
    setMessages([{ from: "bot", text: "안녕하세요! DevPilot 에이전트입니다. 무엇을 도와드릴까요?", type: "bot" }]);
    setInput("");
    setIsLoading(false);
  }, []);

  return {
    messages,
    input,
    isLoading,
    setInput,
    handleSendMessage,
    resetChat,
  };
};
