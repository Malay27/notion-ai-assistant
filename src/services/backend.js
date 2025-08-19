/**
 * Backend Service - Communication with Python FastAPI backend
 * Handles AI command interpretation and backend health checks
 * 
 * @author Malay
 * @version 1.0.0-beta
 */

import axios from 'axios';
import { config } from '../config/index.js';

export class BackendService {
    constructor() {
        this.baseURL = config.backend.url;
        this.timeout = config.backend.timeout || 30000;
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Check backend health and status
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/');
            return response.data;
        } catch (error) {
            throw new Error(`Backend health check failed: ${error.message}`);
        }
    }

    /**
     * Get detailed health information
     */
    async getHealthDetails() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            throw new Error(`Backend health details failed: ${error.message}`);
        }
    }

    /**
     * Send command to backend for AI interpretation
     */
    async interpretCommand(command, userId = 'default') {
        try {
            // Use extended timeout for AI interpretation (can be slow)
            const aiTimeout = 90000; // 90 seconds for AI processing
            
            const response = await this.client.post('/interpret', {
                command,
                user_id: userId
            }, {
                timeout: aiTimeout // Override default timeout for this request
            });
            
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(`Backend interpretation failed: ${error.response.data.detail || error.response.statusText}`);
            }
            if (error.code === 'ECONNABORTED') {
                throw new Error(`AI interpretation timeout (90s) - try simpler commands or check if CodeLlama is running properly`);
            }
            throw new Error(`Backend connection failed: ${error.message}`);
        }
    }

    /**
     * Check if backend is available
     */
    async isAvailable() {
        try {
            await this.healthCheck();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get backend status information
     */
    async getStatus() {
        try {
            const health = await this.healthCheck();
            
            return {
                available: true,
                service: health.service,
                version: health.version,
                aiModel: health.ai_service,
                modelStatus: health.api_status?.status || 'unknown',
                primaryModel: health.primary_model,
                endpoint: health.api_status?.endpoint,
                features: health.features
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Check backend health for settings display
     */
    async checkHealth() {
        try {
            const health = await this.healthCheck();
            const details = await this.getHealthDetails();
            
            return {
                success: true,
                data: {
                    service: health.service,
                    version: health.version,
                    ai_model: health.primary_model,
                    model_status: health.api_status?.status || 'unknown',
                    device: 'local'
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

const backendService = new BackendService();

export { backendService };