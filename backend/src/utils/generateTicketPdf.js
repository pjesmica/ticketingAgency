import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FONT_REGULAR = path.join(__dirname, '../fonts/DejaVuSans.ttf');
const FONT_BOLD = path.join(__dirname, '../fonts/DejaVuSans-Bold.ttf');

console.log('[FONT] Regular postoji:', fs.existsSync(FONT_REGULAR));
console.log('[FONT] Bold postoji:', fs.existsSync(FONT_BOLD));

const fetchImageBuffer = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error('[PDF] Greška pri učitavanju slike:', err.message);
    return null;
  }
};

export const generateTicketPdf = async ({ order, orderItem, event, ticketIndex }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const barcodeData = `${order._id}-${ticketIndex}`;

      const barcodeBuffer = await bwipjs.toBuffer({
        bcid: 'datamatrix',
        text: barcodeData,
        scale: 5,
        padding: 4,
        backgroundcolor: 'ffffff',
      });

      const linearBuffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: barcodeData,
        scale: 2,
        height: 12,
        includetext: false,
        backgroundcolor: 'ffffff',
      });

      let ticketImageBuffer = null;
      if (event.ticketImage) {
        ticketImageBuffer = await fetchImageBuffer(event.ticketImage);
      }

      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: { Title: `Ulaznica - ${event.name}`, Author: 'Ticketyx' },
      });

      try {
        doc.registerFont('Regular', FONT_REGULAR);
        doc.registerFont('Bold', FONT_BOLD);
        console.log('[FONT] Fontovi ucitani uspesno');
      } catch (fontErr) {
        console.error('[FONT] Greska pri ucitavanju fonta:', fontErr.message);
      }

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = 595;
      const H = 842;
      const PAD = 20;

      doc.rect(0, 0, W, H).fill('#ffffff');

      // ── BANNER ─────────────────────────────────────────────────
      const bannerH = 28;
      doc.rect(0, 0, W, bannerH).fill('#111111');
      doc.fontSize(9).font('Bold').fillColor('#ffffff')
        .text('E-ULAZNICA', PAD, 9, { width: W - PAD * 2, align: 'left' });
      doc.fontSize(9).font('Regular').fillColor('#cccccc')
        .text('Ticketyx', PAD, 9, { width: W - PAD * 2, align: 'right' });

      // ── KARTA BOX ──────────────────────────────────────────────
      const cardY = bannerH + 10;
      const cardH = 190;
      const cardW = W - PAD * 2;

      doc.rect(PAD, cardY, cardW, cardH).lineWidth(1).strokeColor('#cccccc').stroke();

      // Leva sekcija — slika (200px)
      const imgSecW = 200;
      if (ticketImageBuffer) {
        doc.save();
        doc.rect(PAD, cardY, imgSecW, cardH).clip();
        doc.image(ticketImageBuffer, PAD, cardY, {
          width: imgSecW,
          height: cardH,
          cover: [imgSecW, cardH],
        });
        doc.restore();
        doc.rect(PAD, cardY, imgSecW, cardH).fillOpacity(0.35).fill('#000000');
        doc.fillOpacity(1);
      } else {
        doc.rect(PAD, cardY, imgSecW, cardH).fill('#1a1a2e');
      }

      // Naziv na slici
      doc.fontSize(20).font('Bold').fillColor('#ffffff')
        .text(event.name?.toUpperCase() || '', PAD + 10, cardY + 14, {
          width: imgSecW - 20,
          align: 'left',
        });

      // Datum i mesto dole na slici
      const eventDate = new Date(event.startDate);
      const dateStr = eventDate.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = eventDate.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
      doc.fontSize(11).font('Bold').fillColor('#ffffff')
        .text(`${dateStr}  ${timeStr}h`, PAD + 10, cardY + cardH - 38, { width: imgSecW - 20 });
      doc.fontSize(10).font('Regular').fillColor('#dddddd')
        .text(event.venue?.name || event.location || '', PAD + 10, cardY + cardH - 22, { width: imgSecW - 20 });

      // Vertikalni separator
      doc.moveTo(PAD + imgSecW, cardY + 10).lineTo(PAD + imgSecW, cardY + cardH - 10)
        .lineWidth(0.5).strokeColor('#dddddd').stroke();

      // ── Srednja sekcija — info ──────────────────────────────────
      const midX = PAD + imgSecW + 14;
      const bcAreaW = 130;
      const midW = cardW - imgSecW - bcAreaW - 28;

      const drawInfo = (label, value, x, y, w) => {
        doc.fontSize(7.5).font('Regular').fillColor('#999999').text(label, x, y, { width: w });
        doc.fontSize(12).font('Bold').fillColor('#111111').text(value || '—', x, y + 12, { width: w });
      };

      drawInfo('TIP ULAZNICE', orderItem.ticketType?.toUpperCase() || 'REGULAR', midX, cardY + 14, midW);
      drawInfo('CENA', `${orderItem.price?.toLocaleString('sr-RS') || 0} RSD`, midX, cardY + 52, midW);
      drawInfo('KUPAC', order.user?.name || 'Gost', midX, cardY + 90, midW);

      // Sedište
      if (orderItem.seats && orderItem.seats.length > 0) {
        const seat = orderItem.seats[0];
        const parts = [];
        if (seat.sector) parts.push(`Sekcija: ${seat.sector}`);
        if (seat.row) parts.push(`Red: ${seat.row}`);
        if (seat.seatNumber) parts.push(`Br: ${seat.seatNumber}`);
        if (parts.length > 0) {
          drawInfo('SEDIŠTE', parts.join('   '), midX, cardY + 128, midW);
        }
      }

      // Transakcija — sasvim dole
      doc.fontSize(7).font('Regular').fillColor('#aaaaaa')
        .text(`Br. transakcije: ${order._id}`, midX, cardY + cardH - 16, { width: midW });

      // ── Desna sekcija — barkodovi ───────────────────────────────
      const bcX = W - PAD - bcAreaW + 10;
      const dmSize = 88;
      const dmY = cardY + 12;

      doc.rect(bcX - 4, dmY - 4, dmSize + 8, dmSize + 8).fill('#ffffff').strokeColor('#eeeeee').lineWidth(0.5).stroke();
      doc.image(barcodeBuffer, bcX, dmY, { width: dmSize, height: dmSize });

      const linY = dmY + dmSize + 10;
      const linW = dmSize + 8;
      doc.rect(bcX - 4, linY - 2, linW, 34).fill('#ffffff');
      doc.image(linearBuffer, bcX - 4, linY, { width: linW, height: 28 });
      doc.fontSize(6).font('Regular').fillColor('#666666')
        .text(barcodeData, bcX - 4, linY + 30, { width: linW, align: 'center' });

      // ── SEPARATOR ───────────────────────────────────────────────
      const sepY = cardY + cardH + 16;
      doc.moveTo(PAD, sepY).lineTo(W - PAD, sepY).lineWidth(0.5).strokeColor('#dddddd').stroke();

      // ── KUPAC INFO ──────────────────────────────────────────────
      doc.fontSize(10).font('Bold').fillColor('#111111')
        .text('E-ULAZNICA', PAD, sepY + 12);
      doc.fontSize(10).font('Regular').fillColor('#333333')
        .text(`Kupac: ${(order.user?.name || 'Gost').toUpperCase()}`, PAD, sepY + 28);
      doc.fontSize(9).font('Regular').fillColor('#999999')
        .text('Strana 1 od 1', W - PAD - 80, sepY + 28, { width: 80, align: 'right' });

      // ── SEPARATOR 2 ─────────────────────────────────────────────
      const sep2Y = sepY + 52;
      doc.moveTo(PAD, sep2Y).lineTo(W - PAD, sep2Y).lineWidth(0.5).strokeColor('#dddddd').stroke();

      // ── USLOVI ──────────────────────────────────────────────────
      const usloviY = sep2Y + 12;
      const usloviW = W - PAD * 2;

      doc.fontSize(8).font('Bold').fillColor('#111111')
        .text('OPŠTE INFORMACIJE I OBAVEZUJUĆA PRAVILA KORIŠĆENJA KOJA JE KUPAC PRIHVATIO KUPOVINOM:', PAD, usloviY, { width: usloviW });

      const uslovi = [
        'E-ulaznica je posebna verzija ulaznice za navedeni događaj i ima isto značenje i upotrebnu vrednost kao i klasična ulaznica.',
        'E-ulaznicu je potrebno odštampati na običnom belom papiru A4 formata i pokazati prilikom ulaska na događaj. E-ulaznica koja nije odštampana nije validna.',
        'E-ulaznica važi na donosioca i dozvoljava jedan ulazak na događaj, prvoj osobi koja se pojavi na ulazu, pri čemu će biti izvršena validacija i poništavanje bar koda.',
        'Svaki naredni pokušaj ulaska sa iskorišćenom e-ulaznicom ili njenim kopijama neće biti moguć.',
        'Povraćaj novca za kupljenu e-ulaznicu nije moguć. Zamena e-ulaznice nije moguća.',
        'Prodavac ulaznice je posrednik pri prodaji ulaznica i ne odgovara za organizaciju događaja, promene u programu, datumu održavanja i satnici kao ni za eventualni povrat novca.',
      ];

      let currentY = usloviY + 16;
      uslovi.forEach((tekst) => {
        doc.fontSize(7.5).font('Regular').fillColor('#333333')
          .text(`■  ${tekst}`, PAD, currentY, { width: usloviW });
        currentY += doc.heightOfString(`■  ${tekst}`, { width: usloviW }) + 5;
      });

      // ── FOOTER ──────────────────────────────────────────────────
      const footerY = H - 52;
      doc.moveTo(PAD, footerY).lineTo(W - PAD, footerY).lineWidth(0.5).strokeColor('#dddddd').stroke();
      doc.fontSize(7.5).font('Regular').fillColor('#999999').text(
        'Dokument odštampati na običnom (belom) papiru A4 formata i ceo doneti na događaj.\n' +
        'Kopiranje ovog dokumenta nema svrhu, jedinstveni bar kod dozvoljava samo jedno korišćenje.\n' +
        'Elektronska validacija bar koda je jedini merodavan način za utvrđivanje ispravnosti.',
        PAD, footerY + 10, { width: usloviW, align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};