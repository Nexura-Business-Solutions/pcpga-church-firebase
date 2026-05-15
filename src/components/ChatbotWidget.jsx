import { useEffect } from 'react';

export default function ChatbotWidget() {
    useEffect(() => {
        if (document.getElementById('bp-inject')) return;

        // Step 1: load the inject script
        const inject = document.createElement('script');
        inject.id = 'bp-inject';
        inject.src = 'https://cdn.botpress.cloud/webchat/v3.6/inject.js';
        inject.async = true;

        // Step 2: after inject loads, load the bot config script
        inject.onload = () => {
            if (document.getElementById('bp-config')) return;
            const config = document.createElement('script');
            config.id = 'bp-config';
            config.src =
                'https://files.bpcontent.cloud/2026/02/25/02/20260225023609-DDMRKHVK.js';
            config.defer = true;
            document.body.appendChild(config);
        };

        document.body.appendChild(inject);
    }, []);

    return null;
}
