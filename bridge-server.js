#!/usr/bin/env node
/**
 * TriEdge Office WebSocket Bridge
 * Forwards messages between PWA clients and OpenClaw gateway
 */

const WebSocket = require('ws');
const http = require('http');
const https = require('https');

// Configuration
const BRIDGE_PORT = 3737;
const GATEWAY_URL = 'http://localhost:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_TOKEN || 'your-gateway-token-here';

// Create WebSocket server
const wss = new WebSocket.Server({ port: BRIDGE_PORT });

console.log(`🔱 TriEdge Bridge started on port ${BRIDGE_PORT}`);
console.log(`📡 Gateway: ${GATEWAY_URL}`);

wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`🔌 Client connected: ${clientIp}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'TriEdge Bridge connected',
        timestamp: Date.now()
    }));
    
    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data);
            const text = message.text || message.message; // Support both formats
            console.log(`📨 Received from client: ${text?.substring(0, 50)}`);
            
            if (!text) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'No text provided'
                }));
                return;
            }
            
            // Send typing indicator
            ws.send(JSON.stringify({
                type: 'typing',
                value: true
            }));
            
            // Forward to OpenClaw gateway
            const response = await sendToGateway(text);
            
            // Stop typing indicator
            ws.send(JSON.stringify({
                type: 'typing',
                value: false
            }));
            
            // Send response
            ws.send(JSON.stringify({
                type: 'response',
                message: response,
                timestamp: Date.now()
            }));
            
        } catch (err) {
            console.error('❌ Error processing message:', err);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message'
            }));
        }
    });
    
    ws.on('close', () => {
        console.log(`🔌 Client disconnected: ${clientIp}`);
    });
    
    ws.on('error', (err) => {
        console.error('❌ WebSocket error:', err);
    });
});

/**
 * Send message to OpenClaw gateway using HTTP API
 */
async function sendToGateway(text) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: text,
            sessionKey: 'agent:main'
        });
        
        const options = {
            hostname: 'localhost',
            port: 18789,
            path: '/api/v1/sessions/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
                'Authorization': `Bearer ${GATEWAY_TOKEN}`
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response.reply || response.message || 'No response');
                } catch (err) {
                    resolve(data || 'No response from OpenClaw');
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('Gateway error:', error.message);
            resolve('Error communicating with OpenClaw');
        });
        
        req.write(postData);
        req.end();
    });
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down bridge server...');
    wss.close(() => {
        console.log('✅ Bridge server closed');
        process.exit(0);
    });
});
