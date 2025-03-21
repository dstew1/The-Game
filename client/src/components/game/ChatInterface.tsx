import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import type { ChatMessage } from "@db/schema";
import MentorReactions from "./MentorReactions";

function TypingIndicator() {
  return (
    <div className="flex space-x-2 p-4 bg-gray-800 rounded-lg max-w-[80%] animate-pulse">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] h-24 rounded-lg animate-pulse ${
              i % 2 === 0 ? "bg-primary/20" : "bg-gray-800"
            }`}
            style={{ width: `${Math.random() * 30 + 50}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function ChatInterface() {
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: isLoadingHistory } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/history"],
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
      setMessage("");
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isSending) {
      sendMessage(message);
    }
  };

  return (
    <Card className="bg-black border-primary">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          AI Mentor Chat
          {(isLoadingHistory || isSending) && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-[400px]">
          <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
            {isLoadingHistory ? (
              <MessageSkeleton />
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`relative max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-primary text-black"
                          : "bg-gray-800 text-white"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <MentorReactions message={msg.content} />
                      )}
                      <p className="break-words">{msg.content}</p>
                      <span className="text-xs opacity-50 mt-1 block">
                        {new Date(msg.createdAt!).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <TypingIndicator />
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask your mentor anything..."
              disabled={isSending}
              className="flex-1 bg-gray-900 border-primary text-white"
            />
            <Button
              type="submit"
              disabled={!message.trim() || isSending}
              className="bg-primary text-black hover:bg-primary/90"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}