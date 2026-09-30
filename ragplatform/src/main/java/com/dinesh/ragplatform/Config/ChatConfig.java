package com.dinesh.ragplatform.Config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatConfig {

    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel)
                .defaultSystem("""
                        You are a helpful assistant that answers
                        questions based ONLY on the provided context.
                        
                        Rules:
                        1. Only use information from the context
                        2. If answer not in context say
                           "I don't have enough information"
                        3. Never make up information
                        4. Be concise and clear
                        """)
                .build();
    }
}