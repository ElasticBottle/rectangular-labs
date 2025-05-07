"use client";

import { backend } from "@/lib/backend";
import { useChat } from "@ai-sdk/react";
import {
  ChatInput,
  ChatInputSubmit,
  ChatInputTextArea,
} from "@rectangular-labs/ui/components/chat/chat-input";
import {
  ChatMessage,
  ChatMessageAvatar,
  ChatMessageContent,
} from "@rectangular-labs/ui/components/chat/chat-message";
import { ChatMessageArea } from "@rectangular-labs/ui/components/chat/chat-message-area";
import { FilePreview } from "@rectangular-labs/ui/components/chat/file-preview";
import { TypingIndicator } from "@rectangular-labs/ui/components/chat/typing-indicator";
import { Paperclip } from "@rectangular-labs/ui/components/icon";
import { ThemeToggle } from "@rectangular-labs/ui/components/theme-provider";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: ChatInterface,
  loader: async () => {
    try {
      const response = await backend.api.auth.me.$get();
      return response.json();
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      return { message: "Welcome!" }; // Default data if fetch fails
    }
  },
});

function ChatInterface() {
  const [attachedFiles, setAttachedFiles] = useState<FileList | undefined>(
    undefined,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useChat({
      api: backend.api.chat.$url().href,
      onToolCall({ toolCall }) {
        console.log("toolCall", toolCall);
      },
    });
  console.log("messages", messages);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      return;
    }
    const currentFileCount = attachedFiles?.length ?? 0;
    if (currentFileCount + files.length > 5) {
      alert("You can attach a maximum of 5 files.");
      return;
    }
    setAttachedFiles((prev) => {
      if (prev) {
        const dt = new DataTransfer();
        for (const file of prev) {
          dt.items.add(file);
        }
        for (const file of files) {
          dt.items.add(file);
        }
        return dt.files;
      }
      return files;
    });
  };

  const removeFile = (indexToRemove: number) => {
    if (!attachedFiles) return;
    const dt = new DataTransfer();
    let index = 0;
    for (const file of attachedFiles) {
      if (index !== indexToRemove) {
        dt.items.add(file);
      }
      index++;
    }

    const newFileList = dt.files.length > 0 ? dt.files : undefined;
    setAttachedFiles(newFileList);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFormSubmit = () => {
    handleSubmit(undefined, {
      experimental_attachments: attachedFiles ?? [],
    });
    setAttachedFiles(undefined);
  };
  return (
    <div className="flex h-screen flex-col">
      <ThemeToggle className="absolute top-4 right-4 z-10" />
      <div className="flex-1 overflow-y-auto">
        <ChatMessageArea>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pt-5 pb-5">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                type={message.role === "user" ? "outgoing" : "incoming"}
                variant="full"
                id={message.id}
              >
                {message.role !== "user" && <ChatMessageAvatar />}
                <div>
                  {message.parts.map((part) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <ChatMessageContent
                            key={JSON.stringify(part)}
                            id={message.id}
                            messageContent={part.text}
                          />
                        );
                      case "file":
                        return (
                          <ChatMessageContent
                            key={JSON.stringify(part)}
                            id={message.id}
                            messageContent={[part]}
                          />
                        );
                      case "reasoning":
                        return (
                          <ChatMessageContent
                            key={JSON.stringify(part)}
                            id={message.id}
                            messageContent={part.reasoning}
                          />
                        );
                      case "source":
                        return (
                          <ChatMessageContent
                            key={JSON.stringify(part)}
                            id={message.id}
                            messageContent={part.source.url}
                          />
                        );
                      default:
                        return null;
                    }
                  })}
                  {message.experimental_attachments &&
                    message.experimental_attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {message.experimental_attachments
                          .filter((att) =>
                            att.contentType?.startsWith("image/"),
                          )
                          .map((attachment, index) => (
                            <img
                              key={`${message.id}-att-img-${index}`}
                              src={attachment.url}
                              alt={attachment.name ?? "image attachment"}
                              className="h-20 w-auto max-w-[150px] rounded object-contain"
                            />
                          ))}
                        {message.experimental_attachments
                          .filter(
                            (att) => !att.contentType?.startsWith("image/"),
                          )
                          .map((attachment, index) => (
                            <div
                              key={`${message.id}-att-file-${index}`}
                              className="rounded border bg-muted/50 p-1 text-xs"
                            >
                              📄 {attachment.name ?? "file"}
                            </div>
                          ))}
                      </div>
                    )}
                </div>
                {message.role === "user" && <ChatMessageAvatar />}
              </ChatMessage>
            ))}
            {isLoading && (
              <ChatMessage type="incoming" id="typing" variant="full">
                <ChatMessageAvatar />
                <TypingIndicator />
              </ChatMessage>
            )}
          </div>
        </ChatMessageArea>
      </div>

      <div className="flex w-full justify-center p-2">
        <div className=" w-full max-w-3xl">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.txt,.md"
          />

          {attachedFiles && attachedFiles.length > 0 && (
            <div className="flex max-h-20 flex-wrap gap-2 overflow-y-auto pb-2">
              {Array.from(attachedFiles).map((file, index) => (
                <FilePreview
                  key={`${file.name}-${index}`}
                  file={file}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          )}

          <ChatInput
            value={input}
            onChange={handleInputChange}
            loading={isLoading}
            onSubmit={handleFormSubmit}
            onStop={stop}
            variant="default"
            rows={1}
            className="space-y-2"
          >
            <ChatInputTextArea placeholder="Ask about Singapore trademark registration..." />
            <div className="flex w-full justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={triggerFileInput}
                disabled={
                  isLoading || (attachedFiles && attachedFiles.length >= 5)
                }
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <ChatInputSubmit
                type="submit"
                className="rounded-full"
                onSubmit={handleFormSubmit}
              />
            </div>
          </ChatInput>
        </div>
      </div>
    </div>
  );
}
