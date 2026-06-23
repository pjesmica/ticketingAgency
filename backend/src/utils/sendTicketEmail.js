import transporter from '../config/emailConfig.js';
import { generateTicketPdf } from './generateTicketPdf.js';

export const sendTicketEmail = async ({ order, event }) => {
  const userName = order.user?.name || 'kupče';
  const userEmail = order.user?.email;

  if (!userEmail) {
    throw new Error('Korisnik nema email adresu');
  }

  const attachments = [];

  for (let i = 0; i < order.orderItems.length; i++) {
    const item = order.orderItems[i];

    for (let q = 0; q < (item.quantity || 1); q++) {
      const ticketIndex = attachments.length;

      const pdfBuffer = await generateTicketPdf({
        order,
        orderItem: item,
        event,
        ticketIndex,
      });

      attachments.push({
        filename: `ulaznica-${ticketIndex + 1}.pdf`,
        content: pdfBuffer,
      });
    }
  }

  const eventDate = new Date(event.startDate).toLocaleDateString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const eventTime = new Date(event.startDate).toLocaleTimeString('sr-RS', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const venueName = event.venue?.name || event.location || '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #222;">
      <h2 style="color:#1a1a2e;">Hvala na kupovini!</h2>
      <br>
      <p>Poštovani/a <strong>${userName}</strong>,</p>

      <p>U prilogu se nalaze Vaše ulaznice za događaj:</p>

      <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:15px 0;">
        <h3 style="margin:0;">${event.name}</h3>
        <p> ${eventDate} u ${eventTime}h</p>
        ${venueName ? `<p> ${venueName}</p>` : ''}
        <p> Broj ulaznica: ${attachments.length}</p>
      </div>

      <p>Molimo vas da ulaznice odštampate ili pokažete na telefonu pri ulazu.</p>

      <p style="font-size:12px;color:#999;margin-top:30px;">
        Ovo je automatska poruka — ne odgovarajte na ovaj email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: '"Ticketyx" <' + process.env.EMAIL_USER + '>',
    replyTo: 'ticketyx@proton.me',
    to: userEmail,
    subject: `Vaše ulaznice — ${event.name}`,
    html,
    attachments,
  });
};