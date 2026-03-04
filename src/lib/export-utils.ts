// CSV Export utility
export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Simple text/PDF-like export
export function exportToText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Print as PDF (browser print dialog)
export function printAsPDF(content: string, title: string) {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(`
      <html><head><title>${title}</title>
      <style>body{font-family:monospace;white-space:pre-wrap;padding:40px;max-width:800px;margin:auto;font-size:12px;line-height:1.6;}</style>
      </head><body>${content}</body></html>
    `);
    w.document.close();
    w.print();
  }
}
