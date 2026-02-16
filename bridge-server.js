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
 * Send message to OpenClaw gateway by writing to stdin
 */
async function sendToGateway(text) {
    return new Promise((resolve, reject) => {
        const { spawn } = require('child_process');
        
        // Spawn OpenClaw in interactive mode
        const proc = spawn('bash', ['-c', `echo "${text.replace(/"/g, '\\"')}" | openclaw`], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });
        
        let output = '';
        let errorOutput = '';
        
        proc.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        proc.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        proc.on('close', (code) => {
            if (code !== 0 && code !== null) {
                console.error('OpenClaw exited with code:', code);
                console.error('Stderr:', errorOutput);
                resolve('Error communicating with OpenClaw');
                return;
            }
            
            // Clean up the output
            const cleaned = output
                .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI codes
                .trim();
            
            resolve(cleaned || 'No response');
        });
        
        setTimeout(() => {
            proc.kill();
            resolve('Request timed out');
        }, 30000); // 30 second timeout
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
