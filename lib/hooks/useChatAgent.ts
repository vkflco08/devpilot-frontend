import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { sendMessageToAgent, ChatMessage } from "@/services/chatbotApi"; // ChatMessage도 함께 임포트
import { fetchChatHistory } from "@/services/chatbotApi";

interface UseChatAgentReturn {
  messages: Message[];
  input: string;
  isLoading: boolean;
  setInput: (input: string) => void;
  handleSendMessage: () => Promise<void>;
  resetChat: () => void;
}

type Message = { from: "user" | "bot"; text: string; };

export const useChatAgent = (userId: number): UseChatAgentReturn => {
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: "안녕하세요! DevPilot 에이전트입니다. 무엇을 도와드릴까요?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  // 에이전트 상태 확인 API
  const checkAgentHealth = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_LLM_AGENT_URL}/health`);
      if (response.data.status !== "ok") {
        throw new Error(`Agent is not healthy: ${response.data.message || response.statusText}`);
      }
      return true;
    } catch (error) {
      console.error("LLM Agent Health Check Failed:", error);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "❌ 에이전트 서버 연결에 문제가 발생했습니다." },
      ]);
      return false;
    }
  }, []); // 의존성 배열 비워두어 한 번만 생성되도록 함

  // 채팅 기록 로딩
  useEffect(() => {
    const loadChatHistory = async () => {
      setIsLoading(true);
      try {
        const historyResponse = await fetchChatHistory(userId);
        const chatMessages = historyResponse.messages || []; // 응답 객체 안에 messages 배열이 없을 경우를 대비하여 빈 배열 기본값 설정
        const loadedMessages: Message[] = chatMessages.map((msg) => ({
          from: msg.sender === "user" ? "user" : "bot",
          text: msg.content,
        }));
        
        // 데이터가 없는 경우 기본 메시지 추가
        if (loadedMessages.length === 0) {
          setMessages([{ from: "bot", text: "안녕하세요! DevPilot 에이전트입니다. 무엇을 도와드릴까요?" }]);
        } else {
          setMessages(loadedMessages);
        }
        setHasLoadedHistory(true); // 기록 로딩 완료
      } catch (error) {
        console.error("Failed to load chat history:", error);
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: "❌ 채팅 기록을 불러오는 데 실패했습니다." },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && !hasLoadedHistory) { // userId가 유효하고 아직 기록을 불러오지 않았다면
      loadChatHistory();
    }
  }, [userId, hasLoadedHistory]);

  const handleSendMessage = useCallback(async () => {
    if (input.trim() === "" || isLoading) return;

    setIsLoading(true);

    const userMessage: Message = { from: "user", text: input };
    const messagesAfterUserSend = [...messages, userMessage];
    setMessages(messagesAfterUserSend);
    setInput("");

    try {
      const isAgentHealthy = await checkAgentHealth();
      if (!isAgentHealthy) {
        return;
      }

      const chatHistory: ChatMessage[] = messagesAfterUserSend.map((msg) => ({
        type: msg.from === "user" ? "user" : "bot",
        content: msg.text,
      }));
      
      const botResponse = await sendMessageToAgent({
        user_input: userMessage.text, 
        chat_history: chatHistory,
        user_id: userId,
      });

      setMessages((prev) => [...prev, { from: "bot", text: botResponse }]);
    } catch (err: any) {
      console.error("Failed to send message to agent:", err);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: `❌ 메시지 전송 중 오류 발생: ${err.message}. 잠시 후 다시 시도해주세요.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, checkAgentHealth, userId]); // 의존성 배열에 필요한 상태와 함수 포함

  const resetChat = useCallback(() => {
    setMessages([{ from: "bot", text: "안녕하세요! DevPilot 에이전트입니다. 무엇을 도와드릴까요?" }]);
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