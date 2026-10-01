package com.dinesh.ragplatform.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Local development
        config.addAllowedOrigin("http://localhost:3000");
        config.addAllowedOrigin("http://localhost:5173");

        // Actual Azure Static Web Apps frontend URL
        config.addAllowedOrigin("https://mango-dune-01f9ff200.5.azurestaticapps.net");

        // Actual Azure App Service backend URL
        config.addAllowedOrigin("https://ragplatform-app-auahfubfb6cyf9bz.centralindia-01.azurewebsites.net");

        // Pattern fallback for Azure subdomains
        config.setAllowedOriginPatterns(List.of(
                "https://*.azurestaticapps.net",
                "https://*.azurewebsites.net"
        ));

        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}