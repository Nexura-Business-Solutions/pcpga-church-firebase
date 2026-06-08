import { useEffect } from 'react';

// Botpress "PCP Support Agent" webchat — a floating bubble injected once and
// initialised with the shared bot config. botId/clientId are stable; the
// cosmetic config (name / avatar / colour / theme) is also managed in Botpress.
const INJECT_SRC = 'https://cdn.botpress.cloud/webchat/v3.6/inject.js';
const BOT_CONFIG = {
    botId: 'e75fa932-ddb0-45f8-9604-a0f97e23fff2',
    clientId: '82bd6748-f342-48c8-811b-47619ad8b8b9',
    configuration: {
        botName: 'PCP Support Agent',
        botAvatar: 'https://files.bpcontent.cloud/2026/06/08/07/20260608071937-6HMHOEUL.png',
        color: '#183A5A',
        themeMode: 'dark',
        radius: 2.5,
    },
};

export default function ChatbotWidget() {
    useEffect(() => {
        if (window.__pcpBotpressInit) return undefined; // guard StrictMode / remounts

        const start = () => {
            if (window.__pcpBotpressInit) return;
            if (!window.botpress || typeof window.botpress.init !== 'function') return;
            window.__pcpBotpressInit = true;
            window.botpress.init(BOT_CONFIG);
        };

        const existing = document.getElementById('bp-webchat-inject');
        if (existing) { start(); return undefined; }

        const s = document.createElement('script');
        s.id = 'bp-webchat-inject';
        s.src = INJECT_SRC;
        s.defer = true;
        s.onload = start;
        document.body.appendChild(s);
        return undefined;
    }, []);

    return null;
}
