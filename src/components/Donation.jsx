import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { getDonationContent } from '../lib/store.js';
import { functions } from '../lib/firebase.js';

const PRESETS = [500, 1000, 2500, 5000];

const createInvoice = httpsCallable(functions, 'createInvoice');

const DEFAULT_CONTENT = {
    heading: 'Give as you have purposed in your heart',
    scriptureRef: '2 Corinthians 9:7',
    subtitle:
        'Your gifts sustain the preaching of the Word, the training of pastors, the planting of congregations, and the mercy ministries of the Church.',
    contactEmail: '',
};

export default function Donation() {
    const [content, setContent] = useState(DEFAULT_CONTENT);
    const [amount, setAmount] = useState(1000);
    const [isCustom, setIsCustom] = useState(false);
    const [donorName, setDonorName] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        (async () => {
            const data = await getDonationContent();
            if (data) setContent({ ...DEFAULT_CONTENT, ...data });
        })();
    }, []);

    const initiate = async () => {
        const final = Math.floor(Number(amount));
        if (!final || final < 20) {
            alert('Minimum donation is PHP 20.');
            return;
        }
        setGenerating(true);

        try {
            const { data } = await createInvoice({
                amount: final,
                donorName: donorName || 'Anonymous',
                description: 'PCP General Donation',
            });
            // Xendit's hosted checkout cannot be embedded in an iframe
            // (X-Frame-Options), so send the donor there via a full-page redirect.
            if (data?.invoice_url) {
                window.location.href = data.invoice_url;
            } else {
                alert(data?.error || 'Payment failed to initialize.');
                setGenerating(false);
            }
        } catch (e) {
            console.error(e);
            alert('Could not connect to payment gateway.');
            setGenerating(false);
        }
    };

    const { primary, secondary } = splitGiveHeading(content.heading);

    return (
        <section id="donate" className="give" aria-label="Give">
            <div className="give__inner">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="kicker on-dark">Stewardship</span>
                    <h2 className="display-h2">
                        {primary}{secondary && <><br /><em>{secondary}</em></>}
                    </h2>
                    {content.scriptureRef && <p className="give__cite">— {content.scriptureRef}</p>}
                    <p className="give__copy">
                        {content.subtitle ||
                            'Your gifts sustain the preaching of the Word, the training of pastors, the planting of congregations, and the mercy ministries of the Church.'}
                    </p>
                </motion.div>

                <motion.div
                    className="give-form"
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                >
                    <div className="give-form__field">
                        <label htmlFor="donor-name">Your Name (Optional)</label>
                        <input
                            id="donor-name"
                            type="text"
                            className="give-form__input"
                            placeholder="Anonymous"
                            value={donorName}
                            onChange={(e) => setDonorName(e.target.value)}
                        />
                    </div>

                    <div className="give-form__field">
                        <label>Choose an Amount (PHP)</label>
                        <div className="give-form__amounts">
                            {PRESETS.map((v) => (
                                <button
                                    key={v}
                                    className={`give-form__chip ${amount === v && !isCustom ? 'give-form__chip--active' : ''}`}
                                    onClick={() => { setAmount(v); setIsCustom(false); }}
                                >
                                    ₱{v.toLocaleString()}
                                </button>
                            ))}
                        </div>
                        <button
                            className={`give-form__chip ${isCustom ? 'give-form__chip--active' : ''}`}
                            style={{ width: '100%', marginTop: '0.5rem' }}
                            onClick={() => setIsCustom(true)}
                        >
                            Enter a custom amount
                        </button>
                        <AnimatePresence>
                            {isCustom && (
                                <motion.input
                                    type="number"
                                    className="give-form__amount-input"
                                    style={{ marginTop: '0.75rem' }}
                                    placeholder="Amount in PHP"
                                    value={amount}
                                    min="20"
                                    onChange={(e) => setAmount(Math.max(0, e.target.value))}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        className="btn btn--primary btn--on-dark"
                        style={{ width: '100%', justifyContent: 'center', padding: '1.1rem' }}
                        onClick={initiate}
                        disabled={generating}
                    >
                        {generating ? 'Redirecting to secure checkout…' : 'Donate Now'}
                    </button>

                    {content.contactEmail && (
                        <p className="give-form__contact">
                            Questions? Write to <a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a>
                        </p>
                    )}
                </motion.div>
            </div>
        </section>
    );
}

function splitGiveHeading(raw) {
    const t = String(raw || 'Give as you have purposed in your heart').trim().replace(/\.$/, '');
    const words = t.split(/\s+/);
    if (words.length <= 4) return { primary: t + '.', secondary: '' };
    const mid = Math.ceil(words.length / 2);
    return { primary: words.slice(0, mid).join(' '), secondary: words.slice(mid).join(' ') + '.' };
}
