import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportElementAsPdf(element: HTMLElement, filename: string): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (err) {
    console.error('PDF export failed:', err);
    throw err;
  }
}

export function exportInvoiceAsPdfProgrammatic(invoice: any, client: any, firmName: string): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const w = pdf.internal.pageSize.getWidth();

  // Header
  pdf.setFillColor(30, 30, 40);
  pdf.rect(0, 0, w, 40, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(firmName || 'CA Firm', 15, 18);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('TAX INVOICE', w - 15, 18, { align: 'right' });
  pdf.text(`Invoice #: ${invoice.invoice_number}`, w - 15, 26, { align: 'right' });
  pdf.text(`Date: ${invoice.issued_date}`, w - 15, 32, { align: 'right' });

  // Client info
  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bill To:', 15, 55);
  pdf.setFont('helvetica', 'normal');
  pdf.text(client?.name || 'Client', 15, 62);
  pdf.text(`PAN: ${client?.pan_number || '—'}`, 15, 68);
  pdf.text(`Due Date: ${invoice.due_date || '—'}`, 15, 74);

  // Table header
  pdf.setFillColor(245, 245, 250);
  pdf.rect(15, 85, w - 30, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Description', 17, 91);
  pdf.text('Hrs', w - 70, 91, { align: 'right' });
  pdf.text('Rate (₨)', w - 45, 91, { align: 'right' });
  pdf.text('Amount (₨)', w - 17, 91, { align: 'right' });

  // Line items (parse from notes if line items not stored separately)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  let y = 100;
  const lines: string[] = (invoice.notes || '').split('\n').filter((l: string) => l.includes('×'));
  if (lines.length > 0) {
    lines.forEach((line: string) => {
      // e.g. "Statutory Audit: 10h × ₨2000 = ₨20000"
      const desc = line.split(':')[0]?.trim() || line;
      const match = line.match(/([\d.]+)h × ₨([\d,]+) = ₨([\d,]+)/);
      pdf.text(desc.substring(0, 40), 17, y);
      if (match) {
        pdf.text(match[1], w - 70, y, { align: 'right' });
        pdf.text(match[2], w - 45, y, { align: 'right' });
        pdf.text(match[3], w - 17, y, { align: 'right' });
      }
      y += 8;
    });
  } else {
    pdf.text('Professional Services', 17, y);
    pdf.text('—', w - 70, y, { align: 'right' });
    pdf.text('—', w - 45, y, { align: 'right' });
    pdf.text(Number(invoice.amount || 0).toLocaleString(), w - 17, y, { align: 'right' });
    y += 8;
  }

  // Divider
  pdf.setDrawColor(220, 220, 230);
  pdf.line(15, y + 2, w - 15, y + 2);
  y += 10;

  // Totals
  pdf.setFontSize(9);
  pdf.text(`Subtotal:`, w - 55, y);
  pdf.text(`NPR ${Number(invoice.amount || 0).toLocaleString()}`, w - 17, y, { align: 'right' });
  y += 7;
  pdf.text(`VAT (13%):`, w - 55, y);
  pdf.text(`NPR ${Number(invoice.tax || 0).toLocaleString()}`, w - 17, y, { align: 'right' });
  y += 7;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(`TOTAL:`, w - 55, y);
  pdf.text(`NPR ${Number(invoice.total || 0).toLocaleString()}`, w - 17, y, { align: 'right' });

  // Footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 140);
  pdf.text('Payment via Bank Transfer / eSewa / Khalti. Thank you for your business.', w / 2, 275, { align: 'center' });

  pdf.save(`Invoice-${invoice.invoice_number}.pdf`);
}
