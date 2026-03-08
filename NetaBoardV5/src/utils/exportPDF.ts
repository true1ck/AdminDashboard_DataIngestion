// ═══ S1.5 — PDF Report Generator ═══
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Archetype } from '../types';
import { PILLARS, getNRI } from '../data';

export async function generatePDFReport(a: Archetype, ck: string) {
  const nri = getNRI(a);
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  // Capture current view as image
  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    try {
      const canvas = await html2canvas(mainContent, { backgroundColor: '#0A0618', scale: 1.5, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const imgW = w - 28;
      const imgH = (canvas.height * imgW) / canvas.width;
      doc.addImage(imgData, 'PNG', 14, 45, imgW, Math.min(imgH, 180));
    } catch { /* fallback to text-only if canvas fails */ }
  }

  // Header
  doc.setFillColor(10, 6, 24);
  doc.rect(0, 0, w, 40, 'F');
  doc.setTextColor(124, 58, 237);
  doc.setFontSize(20);
  doc.text('NétaBoard V5.0 Sarvashakti', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(139, 128, 168);
  doc.text(`Political Reputation Intelligence Report`, 14, 26);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`, 14, 33);

  // Profile
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text(`${a.n} — ${a.cn.party}, ${a.cn.const}`, 14, 52);
  doc.setFontSize(10);
  doc.text(`Archetype: ${ck} (${a.tg}) | State: ${a.cn.state} | Next Election: ${a.cn.eldt}`, 14, 60);

  // NRI Score
  doc.setFillColor(124, 58, 237);
  doc.roundedRect(14, 68, 50, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(`NRI: ${nri.toFixed(1)}`, 20, 82);

  // 15 Pillars Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text('15-Pillar NRI Breakdown', 14, 100);
  doc.setFontSize(9);

  let y = 108;
  doc.setTextColor(100, 100, 100);
  doc.text('Pillar', 14, y);
  doc.text('Score', 100, y);
  doc.text('Weight', 130, y);
  doc.text('Contribution', 160, y);
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 195, y);
  y += 6;

  doc.setTextColor(0, 0, 0);
  PILLARS.forEach(p => {
    const s = a.dm[p.k] || 50;
    const contrib = ((p.inv ? 100 - s : s) * p.w / 100).toFixed(1);
    doc.text(`${p.i} ${p.l}`, 14, y);
    doc.text(`${s}/100`, 100, y);
    doc.text(`${p.w}%`, 130, y);
    doc.text(`${contrib} pts`, 160, y);
    y += 6;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  // Sansad Record
  y += 8;
  doc.setFontSize(12);
  doc.text('Parliamentary Record', 14, y);
  y += 8;
  doc.setFontSize(9);
  [['Attendance', `${a.san.att}%`], ['Questions Asked', `${a.san.ques}`], ['Private Bills', `${a.san.pvt}`], ['Bills Passed', `${a.san.bill}`]].forEach(([k, v]) => {
    doc.text(`${k}: ${v}`, 14, y);
    y += 6;
  });

  // Rivals
  y += 8;
  doc.setFontSize(12);
  doc.text('Rival Watch', 14, y);
  y += 8;
  doc.setFontSize(9);
  a.rv.forEach(r => {
    doc.text(`${r.n}: NRI ${r.nri} (${r.tr > 0 ? '+' : ''}${r.tr})`, 14, y);
    y += 6;
  });

  // Footer
  const pages = doc.internal.pages.length - 1;
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`NétaBoard V5.0 | Page ${i} of ${pages} | Confidential`, 14, 290);
  }

  // Download
  doc.save(`NétaBoard-Report-${ck}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
