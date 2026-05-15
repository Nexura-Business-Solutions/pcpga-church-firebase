import { useEffect } from 'react';
import { initStore } from '../lib/store.js';

export default function StoreInit() {
    useEffect(() => {
        initStore();
    }, []);
    return null;
}
