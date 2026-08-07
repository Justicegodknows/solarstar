function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMaintenanceReminderHtml(params) {
  const greeting = params.greeting || 'Sehr geehrte Damen und Herren,';
  const bodyHtml = params.bodyHtml || '';
  const ctaHref = params.ctaHref || 'https://www.juergenhohnen.de/termin-vereinbaren/';
  const ctaLabel = params.ctaLabel || 'Termin vereinbaren';
  const signOff = params.signOff || 'Beste Grüße aus Heinsberg<br />Jürgen Hohnen GmbH';

  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Wartungserinnerung</title>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;margin:0 auto;padding:24px;">
      <tr>
        <td>
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">${greeting}</p>
          <div style="font-size:16px;line-height:1.7;color:#1f2937;">${bodyHtml}</div>
          <p style="margin:24px 0;">
            <a href="${ctaHref}" style="display:inline-block;background-color:#0f4c81;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:bold;">${ctaLabel}</a>
          </p>
          <p style="margin:24px 0 4px 0;font-size:15px;">${signOff}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <div style="border-left:3px solid #16a34a;padding-left:12px;">
            <div style="font-size:16px;font-weight:bold;color:#0f4c81;">Mehmet Yilmaz</div>
            <div style="font-size:13px;color:#16a34a;font-weight:bold;margin-bottom:6px;">Kundendienstleiter</div>
            <div style="font-size:13px;color:#374151;line-height:1.6;">
              T 02452 89039<br />
              E <a href="mailto:mehmet@juergenhohnen.de" style="color:#0f4c81;">mehmet@juergenhohnen.de</a><br />
              W <a href="https://www.juergenhohnen.de" style="color:#0f4c81;">www.juergenhohnen.de</a><br />
              A Industrieparkstraße 4 · 52525 Heinsberg
            </div>
          </div>
          <p style="margin:20px 0 4px 0;font-size:12px;color:#6b7280;">
            Folgen Sie uns: <a href="https://www.facebook.com/juergenhohnen/" style="color:#0f4c81;">Facebook</a> · <a href="https://www.instagram.com/hohnen_gmbh/" style="color:#0f4c81;">Instagram</a>
          </p>
          <p style="margin:12px 0 0 0;font-size:11px;color:#9ca3af;line-height:1.5;">
            Geschäftsführer: Jürgen Hohnen · Sitz: Heinsberg · Handelsregister: HRB 10232 · Amtsgericht Aachen
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

module.exports = { escapeHtml, renderMaintenanceReminderHtml };
