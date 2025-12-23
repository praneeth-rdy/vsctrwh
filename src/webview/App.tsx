import React, { useCallback } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { useVSCode, useVSCodeMessageListener } from './hooks/useVSCode';
import { useMessages } from './hooks/useMessages';
import type { ExtensionMessage } from './types';
import './App.css';

function App() {
    const vscode = useVSCode();
    const {
        messages,
        isTyping,
        setIsTyping,
        addMessage,
        addIDEEvent,
        updateMessage,
        removeMessage,
        clearMessages
    } = useMessages();

    // Handle messages from extension
    useVSCodeMessageListener(useCallback((message: ExtensionMessage) => {
        switch (message.command) {
            case 'ideEvent':
                if (message.event) {
                    addIDEEvent(message.event);
                }
                break;
            case 'clearChat':
                clearMessages();
                break;
        }
    }, [addIDEEvent, clearMessages]));

    const handleSend = useCallback((text: string) => {
        if (!text.trim() || isTyping) return;

        // Add user message
        addMessage({
            role: 'user',
            text: text.trim()
        });

        // Send to extension
        vscode.postMessage({ command: 'sendMessage', text: text.trim() });

        // Show typing indicator
        setIsTyping(true);
        const typingId = addMessage({
            role: 'assistant',
            text: 'Thinking...'
        });

        // Simulate response (replace with actual API call)
        setTimeout(() => {
            const responseText = generateResponse(text.trim());
            removeMessage(typingId);
            setIsTyping(false);
            addMessage({
                role: 'assistant',
                text: responseText
            });
        }, 1000);
    }, [isTyping, addMessage, removeMessage, setIsTyping, vscode]);

    const handleClear = useCallback(() => {
        clearMessages();
        vscode.postMessage({ command: 'clearChat' });
    }, [clearMessages, vscode]);

    const generateResponse = (userMessage: string): string => {
        const responses = [
            `I received your message: "${userMessage}". This is a custom chat interface. You can integrate this with any chat API or service.`,
            `Thanks for your message! This custom chat has replaced VS Code's built-in chat. How can I help you?`,
            `I understand you said: "${userMessage}". This extension allows you to use your own chat backend.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    };

    return (
        <div className="chat-container">
            <ChatHeader onClear={handleClear} />
            <MessageList messages={messages} />
            <ChatInput onSend={handleSend} disabled={isTyping} />
        </div>
    );
}

export default App;
