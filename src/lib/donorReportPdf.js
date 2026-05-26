import { jsPDF } from 'jspdf';

// A reliable, paper-fitted donor giving report. Generated as a real A4 PDF
// (jsPDF) instead of relying on CSS @media print, which mis-scales on phones.
// Note: the built-in helvetica font has no ₱ glyph, so amounts use "PHP".

const peso = (n) => Number(n || 0).toLocaleString('en-US');

export function buildDonorReportPdf({ donors = [], rangeLabel = 'All time', generatedLabel = '' } = {}) {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' }); // 210 x 297 mm
    const PAGE_W = 210;
    const PAGE_H = 297;
    const L = 12; // left margin
    const R = 198; // right edge

    // Column geometry (mm)
    const COL = {
        idx: 12, // "#"
        name: 19, // donor name (left)
        nameW: 45,
        email: 66, // email (left)
        emailW: 60,
        gifts: 145, // right-aligned
        total: 174, // right-aligned
        last: R, // right-aligned
    };

    const totalGifts = donors.reduce((s, d) => s + (d.count || 0), 0);
    const totalAmt = donors.reduce((s, d) => s + (d.total || 0), 0);

    const drawTableHeader = (y) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(90);
        pdf.text('#', COL.idx, y);
        pdf.text('DONOR', COL.name, y);
        pdf.text('EMAIL', COL.email, y);
        pdf.text('GIFTS', COL.gifts, y, { align: 'right' });
        pdf.text('TOTAL (PHP)', COL.total, y, { align: 'right' });
        pdf.text('LAST GIFT', COL.last, y, { align: 'right' });
        pdf.setDrawColor(60);
        pdf.setLineWidth(0.4);
        pdf.line(L, y + 1.6, R, y + 1.6);
        pdf.setTextColor(20);
        pdf.setFont('helvetica', 'normal');
        return y + 6;
    };

    // ---- Letterhead (page 1) ----
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(20);
    pdf.text('Presbyterian Church of the Philippines', PAGE_W / 2, 18, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(90);
    pdf.text('DONOR GIVING REPORT', PAGE_W / 2, 24, { align: 'center' });
    pdf.setDrawColor(30);
    pdf.setLineWidth(0.6);
    pdf.line(L, 28, R, 28);

    // ---- Meta ----
    pdf.setFontSize(9);
    pdf.setTextColor(40);
    pdf.text(`Period: ${rangeLabel}`, L, 35);
    if (generatedLabel) pdf.text(`Generated: ${generatedLabel}`, R, 35, { align: 'right' });
    pdf.text(`Donors: ${donors.length}     Gifts: ${totalGifts}     Total: PHP ${peso(totalAmt)}`, L, 40.5);
    pdf.setDrawColor(180);
    pdf.setLineWidth(0.2);
    pdf.line(L, 43.5, R, 43.5);

    // ---- Table ----
    const lineH = 4;
    const bottomLimit = PAGE_H - 18; // leave room for footer
    let y = drawTableHeader(50);
    pdf.setFontSize(8.5);
    pdf.setTextColor(20);

    donors.forEach((d, i) => {
        const name = d.name || 'Anonymous';
        const email = d.email || '—';
        const nameLines = pdf.splitTextToSize(name, COL.nameW);
        const emailLines = pdf.splitTextToSize(email, COL.emailW);
        const rowLines = Math.max(nameLines.length, emailLines.length, 1);
        const rowH = rowLines * lineH + 1.5;

        // Page break — redraw header on the new page
        if (y + rowH > bottomLimit) {
            pdf.addPage();
            y = drawTableHeader(18);
            pdf.setFontSize(8.5);
            pdf.setTextColor(20);
        }

        pdf.text(String(i + 1), COL.idx, y);
        pdf.text(nameLines, COL.name, y);
        pdf.text(emailLines, COL.email, y);
        pdf.text(String(d.count || 0), COL.gifts, y, { align: 'right' });
        pdf.text(peso(d.total), COL.total, y, { align: 'right' });
        pdf.text(d.lastGiftLabel || '—', COL.last, y, { align: 'right' });

        y += rowH;
        pdf.setDrawColor(228);
        pdf.setLineWidth(0.1);
        pdf.line(L, y - 1.5, R, y - 1.5);
    });

    // ---- Total row ----
    if (y + 8 > bottomLimit) {
        pdf.addPage();
        y = 18;
    }
    pdf.setDrawColor(60);
    pdf.setLineWidth(0.5);
    pdf.line(L, y, R, y);
    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.text('TOTAL', COL.name, y);
    pdf.text(String(totalGifts), COL.gifts, y, { align: 'right' });
    pdf.text(`PHP ${peso(totalAmt)}`, COL.total, y, { align: 'right' });

    // ---- Footers on every page ----
    const pageCount = pdf.internal.getNumberOfPages();
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(150);
    for (let p = 1; p <= pageCount; p += 1) {
        pdf.setPage(p);
        pdf.text('Presbyterian Church of the Philippines · Stewardship Records · Confidential', PAGE_W / 2, PAGE_H - 10, { align: 'center' });
        pdf.text(`Page ${p} of ${pageCount}`, R, PAGE_H - 10, { align: 'right' });
    }

    return pdf;
}

export function generateDonorReportPdf(opts = {}) {
    const pdf = buildDonorReportPdf(opts);
    const stamp = new Date().toISOString().slice(0, 10);
    pdf.save(`PCPGA_Donor_Report_${stamp}.pdf`);
}

// Open the report in a new tab as a real PDF — works as a print preview on
// both desktop and phone (the device's PDF viewer can then print or share).
export function previewDonorReportPdf(opts = {}) {
    const pdf = buildDonorReportPdf(opts);
    const url = pdf.output('bloburl');
    const win = window.open(url, '_blank');
    if (!win) {
        // Popup blocked — fall back to navigating the current tab.
        window.location.assign(url);
    }
}
