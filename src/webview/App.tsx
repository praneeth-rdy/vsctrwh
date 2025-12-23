import React, { useState, useEffect, useRef } from 'react';
import './App.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

const vscode = window.vscode || {
    postMessage: (message: { command: string; text?: string }) => {
        console.log('vscode.postMessage called:', message);
    }
};

function App() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        console.log('Messages updated:', messages.length, messages);
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [inputValue]);

    const handleSend = () => {
        const message = inputValue.trim();
        if (!message || isTyping) return;

        const userMessage: Message = {
            id: `msg-${Date.now()}-${Math.random()}`,
            role: 'user',
            text: message,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        if (vscode) {
            vscode.postMessage({ command: 'sendMessage', text: message });
        }

        setIsTyping(true);
        const typingId = `typing-${Date.now()}`;
        const typingMessage: Message = {
            id: typingId,
            role: 'assistant',
            text: 'Thinking...',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, typingMessage]);

        setTimeout(() => {
            const responseText = generateResponse(message);
            console.log('Generating response:', responseText);

            setIsTyping(false);
            setMessages(prev => {
                console.log('Current messages before update:', prev.length);
                const filtered = prev.filter(msg => msg.id !== typingId);
                console.log('Messages after filtering typing:', filtered.length);

                const response: Message = {
                    id: `msg-${Date.now()}-${Math.random()}`,
                    role: 'assistant',
                    text: responseText,
                    timestamp: new Date()
                };

                const updated = [...filtered, response];
                console.log('Messages after adding response:', updated.length, updated);
                return updated;
            });
        }, 1000);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClear = () => {
        setMessages([]);
        vscode.postMessage({ command: 'clearChat' });
    };

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
            <div className="chat-header">
                <h2>Trumio Chat</h2>
                <button className="clear-button" onClick={handleClear}>
                    Clear Chat
                </button>
            </div>
            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-state">
                        <h3>Welcome to Trumio Chat</h3>
                        <p>Start a conversation by typing a message below.</p>
                    </div>
                ) : (
                    <>
                        {messages.map(message => (
                            <div key={message.id} className={`message ${message.role}`}>
                                <div className="message-bubble">{message.text}</div>
                                <div className="message-time">
                                    {message.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="input-container">
                <textarea
                    ref={textareaRef}
                    className="input-field"
                    placeholder="Type your message here.."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                />
                <button
                    className="send-button"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default App;

