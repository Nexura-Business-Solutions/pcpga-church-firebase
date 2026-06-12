import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

function sanitize(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/[<>"'&]/g, '');
}

function SuccessContent() {
    const [searchParams] = useSearchParams();
    const amount = sanitize(searchParams.get('amount')) || '0';
    const ref = sanitize(searchParams.get('ref')) || 'N/A';
    const donorName = sanitize(searchParams.get('name')) || 'Anonymous';
    const [isDownloading, setIsDownloading] = useState(false);

    // Xendit only redirects a donor to this page after a completed payment
    // (failed/expired invoices redirect back to the give section), so we treat
    // arrival here as a confirmed gift. The webhook records the authoritative
    // PAID status server-side for admin reporting; `donations` stays
    // admin-only, so we intentionally do NOT read it from this public page.

    const downloadReceipt = () => {
        setIsDownloading(true);
        const pdf = new jsPDF();

        // Branded Header
        pdf.setFontSize(22);
        pdf.setTextColor(15, 23, 42);
        pdf.text('OFFICIAL RECEIPT', 105, 40, { align: 'center' });

        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text('Presbyterian Church of the Philippines', 105, 50, { align: 'center' });
        pdf.text('Stewardship Office', 105, 55, { align: 'center' });

        // Divider
        pdf.setDrawColor(230);
        pdf.line(20, 65, 190, 65);

        // Details
        pdf.setFontSize(12);
        pdf.setTextColor(30);
        pdf.text(`Reference No: ${ref}`, 20, 80);
        pdf.text(`Donor Name: ${donorName}`, 20, 90);
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 100);

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Amount Received: PHP ${Number(amount).toLocaleString()}.00`, 20, 120);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text('Payment Purpose: General Donation / Stewardship', 20, 130);

        // Thank you note
        pdf.setFontSize(12);
        pdf.text('Thank you for your generous contribution. Your support enables', 20, 160);
        pdf.text('our mission to spread faith, hope, and community service.', 20, 167);

        // Footer
        pdf.setFontSize(9);
        pdf.setTextColor(150);
        pdf.text('This is a computer-generated receipt.', 105, 210, { align: 'center' });

        pdf.save(`PCPGA_Receipt_${ref}.pdf`);
        setIsDownloading(false);
    };

    return (
        <div className="min-h-screen bg-[#f9f9fb] flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-4xl mb-8 border border-green-500/20"
            >
                {donorName !== 'Anonymous' ? '🙏' : '✨'}
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="max-w-xl"
            >
                <h1 className="text-4xl md:text-5xl font-bold text-[#0f172a] mb-6 font-display">
                    {donorName !== 'Anonymous' ? `Thank You, ${donorName}!` : 'Thank You for Your Generosity!'}
                </h1>

                <p className="text-lg text-gray-500 mb-12 leading-relaxed font-medium">
                    Your gift of <span className="text-[#0f172a] font-bold">₱{Number(amount).toLocaleString()}</span> has been received.
                    It is through kindness like yours that we are able to continue our ministry and serve our community.
                </p>

                <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={downloadReceipt}
                        disabled={isDownloading}
                        className="h-14 px-8 bg-[#0f172a] text-white rounded-2xl font-bold text-xs tracking-widest uppercase hover:shadow-xl hover:shadow-black/10 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {isDownloading ? 'Preparing...' : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                {donorName !== 'Anonymous' ? 'Your Receipt' : 'Download Receipt'}
                            </>
                        )}
                    </button>

                    <Link
                        to="/"
                        className="h-14 px-8 bg-white border border-black/5 text-[#0f172a] rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-gray-50 transition-all flex items-center gap-3 shadow-sm"
                    >
                        Back to Home
                    </Link>
                </div>

                <div className="mt-20 p-8 bg-white rounded-[2rem] border border-black/5 shadow-sm text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <h3 className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-4">A Note from the Church</h3>
                    <p className="text-sm text-gray-600 italic leading-[1.8]">
                        &ldquo;Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver. We are truly blessed by your stewardship and commitment to the growth of God&rsquo;s kingdom.&rdquo;
                    </p>
                    <p className="mt-4 text-[11px] font-bold text-[#0f172a] uppercase tracking-widest">— Presbyterian Church of the Philippines</p>
                </div>
            </motion.div>
        </div>
    );
}

export default function DonationSuccessPage() {
    return (
        <>
            <Helmet>
                <title>Thank You | PCP</title>
            </Helmet>
            <Navbar />
            <main id="main-content">
                <SuccessContent />
            </main>
            <Footer />
        </>
    );
}
