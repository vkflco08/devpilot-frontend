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
