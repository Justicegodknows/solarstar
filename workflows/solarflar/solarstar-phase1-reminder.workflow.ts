import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SolarStar Phase 1 - Wartungs-Erinnerungen
// Nodes   : 25  |  Connections: 24
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// TestTrigger                        webhook
// EmployeeTestTrigger                webhook
// ScheduleTrigger                    scheduleTrigger
// EmployeeReminderSchedule           scheduleTrigger            [alwaysOutput] [executeOnce]
// CustomerData                       httpRequest                [creds]
// HeroCompanyPartners                httpRequest                [creds]
// MapHeroCustomers                   code
// GenerateEmail                      httpRequest
// AttachCustomerFields               merge
// Validate                           code
// HumanReview                        wait
// ComposeHtmlEmail                   code
// SendGate                           code
// SendEmail                          microsoftOutlook           [onError→out(1)] [creds]
// HandleSendEmailError               code
// BuildEmployeeTestMessages          code
// SendEmployeeTestEmail              microsoftOutlook           [onError→out(1)] [creds]
// HandleEmployeeTestSendError        code
// PrepareSolarFlareReminders         code
// ReportReminderCoverage             code
// PaceSolarFlareBatches              splitInBatches
// SendSolarFlareReminder             microsoftOutlook           [onError→out(1)] [creds] [alwaysOutput] [retry]
// ThrottleSolarFlareSend             wait
// HandleSolarFlareSendError          code
// InvalidForManualFollowUp           noOp
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// TestTrigger
//    → CustomerData
//      → MapHeroCustomers
//        → GenerateEmail
//          → AttachCustomerFields.in(1)
//            → Validate
//              → HumanReview
//                → ComposeHtmlEmail
//                  → SendGate
//                    → SendEmail
//                     .out(1) → HandleSendEmailError
//              → InvalidForManualFollowUp
//        → AttachCustomerFields (↩ loop)
// EmployeeTestTrigger
//    → BuildEmployeeTestMessages
//      → SendEmployeeTestEmail
//       .out(1) → HandleEmployeeTestSendError
// ScheduleTrigger
//    → CustomerData (↩ loop)
// EmployeeReminderSchedule
//    → HeroCompanyPartners
//      → PrepareSolarFlareReminders
//        → PaceSolarFlareBatches
//         .out(1) → SendSolarFlareReminder
//            → ThrottleSolarFlareSend
//              → PaceSolarFlareBatches (↩ loop)
//           .out(1) → HandleSolarFlareSendError
//      → ReportReminderCoverage
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'TyzTNzhz9QuLKNiH',
    name: 'SolarStar Phase 1 - Wartungs-Erinnerungen',
    active: true,
    isArchived: false,
    settings: {
        executionOrder: 'v1',
        binaryMode: 'separate',
        availableInMCP: true,
        timeSavedMode: 'fixed',
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class SolarstarPhase1WartungsErinnerungenWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '4f8e2b3a-a016-4edf-bc28-b67df5940ae4',
        webhookId: 'f562590d-56cd-48ce-b1c8-8eb4b4a288a5',
        name: 'Test Trigger',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [224, 160],
    })
    TestTrigger = {
        httpMethod: 'POST',
        path: 'solarstar-phase1-test',
        options: {},
    };

    @node({
        id: '9b730f2a-5a70-46f6-a2e5-2a98fbec62ee',
        webhookId: '7a7f4f6b-3a24-4688-a303-b87ec6ef9886',
        name: 'Employee Test Trigger',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [224, 512],
    })
    EmployeeTestTrigger = {
        httpMethod: 'POST',
        path: 'solarstar-employee-test',
        options: {},
    };

    @node({
        id: 'c84cbf6a-0790-4136-a901-bec4c4706446',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [224, 320],
    })
    ScheduleTrigger = {
        rule: {
            interval: [
                {
                    field: 'months',
                },
            ],
        },
    };

    @node({
        id: '430fb8de-8a33-4fbb-bd0b-c2f5fd9fdbb8',
        name: 'Employee Reminder Schedule',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [224, 688],
        alwaysOutputData: true,
        executeOnce: true,
    })
    EmployeeReminderSchedule = {
        rule: {
            interval: [{}, {}],
        },
    };

    @node({
        id: '50926bd3-0dac-4995-a68b-32394de26dda',
        name: 'Customer Data',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [464, 272],
        credentials: { httpHeaderAuth: { id: 'bsL1r7l7hguXNpjs', name: 'HERO API (read-only)' } },
    })
    CustomerData = {
        method: 'POST',
        url: 'https://login.hero-software.de/api/external/v7/graphql',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendBody: true,
        specifyBody: 'json',
        jsonBody:
            '={"query": "query GetDueMaintenance($start: DateTime, $end: DateTime) { field_service_jobs(start: $start, end: $end, first: 200) { id type start title customer { id full_name email } } }", "variables": {"start": "{{$now.minus({days:380}).toISO()}}", "end": "{{$now.minus({days:350}).toISO()}}"}}',
        options: {},
    };

    @node({
        id: '36ca0fd6-6e21-4eb9-993f-7f6f4349fc51',
        name: 'HERO Company Partners',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [480, 688],
        credentials: { httpHeaderAuth: { id: 'bsL1r7l7hguXNpjs', name: 'HERO API (read-only)' } },
    })
    HeroCompanyPartners = {
        method: 'POST',
        url: 'https://login.hero-software.de/api/external/v7/graphql',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendBody: true,
        specifyBody: 'json',
        jsonBody:
            '={"query":"query CompanyPartnersForSolarFlareReminder { company { partners { id full_name email title role account_type status } } }"}',
        options: {},
    };

    @node({
        id: '1ece3681-5571-46f5-88ee-8601ee53a9e1',
        name: 'Map HERO Customers',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [592, 272],
    })
    MapHeroCustomers = {
        jsCode: `const jobs = $input.first().json.data?.field_service_jobs ?? [];
const seenEmails = new Set();
const items = [];

for (const job of jobs) {
  if (job.type !== 'maintenance') continue;
  const email = String(job.customer?.email ?? '').trim();
  if (!email || seenEmails.has(email)) continue;
  seenEmails.add(email);

  items.push({
    json: {
      customer_name: String(job.customer?.full_name ?? '').trim(),
      email,
      equipment_type: job.title ?? '',
      last_service_date: job.start ? String(job.start).slice(0, 10) : '',
    },
  });
}

return items;`,
    };

    @node({
        id: '5ff9d811-e486-4fde-8f01-10f7ce262e4b',
        name: 'Generate Email',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [704, 272],
    })
    GenerateEmail = {
        method: 'POST',
        url: 'http://172.17.0.1:11434/api/generate',
        sendBody: true,
        specifyBody: 'json',
        jsonBody:
            '={"model": "mistral", "stream": false, "prompt": "Du bist Assistent für SolarStar (deutscher Heizungsbetrieb). Schreibe eine kurze, freundliche Wartungserinnerung auf Deutsch. Schreibe ausschließlich auf Deutsch und halte dich an die deutsche Rechtschreibung, insbesondere Umlaute (ä, ö, ü) und ß. Nutze nur diese Daten und erfinde nichts: Name: {{$json.customer_name}}, Anlagentyp: {{$json.equipment_type}}, Letzte Wartung: {{$json.last_service_date}}. Anforderungen: 1) Beginne mit der direkten Anrede und dem Vornamen der Person. 2) 90-160 Wörter. 3) Keine Preiszusagen, keine nicht vorhandenen Details, keine Erwähnung von Gutscheinen. 4) Eindeutige Aufforderung zur Terminvereinbarung bei SolarStar. 5) Erwähne keine Telefonnummern oder E-Mail-Adressen; die Kontaktdaten des Ansprechpartners werden automatisch ergänzt.", "options": {"temperature": 0.3}}',
        options: {},
    };

    @node({
        id: '08715515-1cdd-4187-9abd-294d11442001',
        name: 'Attach Customer Fields',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [944, 272],
    })
    AttachCustomerFields = {
        mode: 'combine',
        combineBy: 'combineByPosition',
        options: {},
    };

    @node({
        id: 'a3fdf0e9-fe57-4385-91f0-48fb912b7530',
        name: 'Validate',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1168, 272],
    })
    Validate = {
        mode: 'runOnceForEachItem',
        jsCode: `const item = $input.item.json;
const generatedText = String(item.response ?? '').trim();
const firstName = String(item.customer_name ?? '').trim().split(/\\s+/)[0] ?? '';
const hasText = generatedText.length >= 50 && generatedText.length <= 1500;
const hasFirstName = firstName.length > 0 && generatedText.toLowerCase().includes(firstName.toLowerCase());
const isValid = hasText && hasFirstName;

return {
  json: {
    ...item,
    generated_email_text: generatedText,
    validation: {
      has_text: hasText,
      has_first_name: hasFirstName,
      text_length: generatedText.length,
    },
    is_valid: isValid,
    review_required: !isValid,
    review_reason: isValid ? '' : 'Text fehlt, ist zu kurz/zu lang oder enthält den Vornamen nicht.',
  },
};`,
    };

    @node({
        id: 'e1474929-e499-464f-bd02-20c8f0dc6eb5',
        webhookId: 'a45235c6-ee4c-4e97-9eb4-904c38089e09',
        name: 'Human Review',
        type: 'n8n-nodes-base.wait',
        version: 1.1,
        position: [1392, 272],
    })
    HumanReview = {
        resume: 'webhook',
        httpMethod: 'POST',
        options: {},
    };

    @node({
        id: 'b9147d0a-10b8-4d8e-b3a8-6ddf8731d8b4',
        name: 'Compose HTML Email',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1600, 272],
    })
    ComposeHtmlEmail = {
        mode: 'runOnceForEachItem',
        jsCode: `const payload = $input.first().json.body ?? $input.first().json ?? {};
const escapeHtml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const customerName = String(payload.customer_name ?? '').trim();
const greeting = customerName ? 'Hallo ' + escapeHtml(customerName) + ',' : 'Sehr geehrte Damen und Herren,';
// Fixed generic copy (no LLM text, no per-customer due date - matches the reference template).
const bodyHtml = 'Die jährliche Wartung Ihrer Heizungsanlage steht im kommenden Monat an.<br/><br/>Damit Ihre Heizungsanlage weiterhin zuverlässig, effizient und sicher läuft, bitten wir Sie, Ihren Wartungstermin rechtzeitig zu vereinbaren.<br/><br/>Vereinbaren Sie Ihren Wunschtermin bequem online über den Button unten. Sollte das online nicht möglich sein, helfen wir Ihnen selbstverständlich auch persönlich weiter – telefonisch unter 02452 89039 oder per E-Mail an info@juergenhohnen.de.<br/><br/>Wir empfehlen eine frühzeitige Terminvereinbarung, damit wir Ihren Wunschtermin berücksichtigen können.<br/><br/>Für Rückfragen stehen wir Ihnen selbstverständlich gerne zur Verfügung.<br/><br/>Vielen Dank für Ihr Vertrauen.';
const html = '<!DOCTYPE html><html lang="de"><body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;margin:0 auto;padding:24px;"><tr><td><p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">' + greeting + '</p><div style="font-size:16px;line-height:1.7;color:#1f2937;">' + bodyHtml + '</div><p style="margin:24px 0;"><a href="https://www.juergenhohnen.de/termin-vereinbaren/" style="display:inline-block;background-color:#0f4c81;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:bold;">Termin vereinbaren</a></p><p style="margin:24px 0 4px 0;font-size:15px;">Beste Grüße aus Heinsberg<br/>Jürgen Hohnen GmbH</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" /><div style="border-left:3px solid #16a34a;padding-left:12px;"><div style="font-size:16px;font-weight:bold;color:#0f4c81;">Mehmet Yilmaz</div><div style="font-size:13px;color:#16a34a;font-weight:bold;margin-bottom:6px;">Kundendienstleiter</div><div style="font-size:13px;color:#374151;line-height:1.6;">T 02452 89039<br/>E <a href="mailto:mehmet@juergenhohnen.de" style="color:#0f4c81;">mehmet@juergenhohnen.de</a><br/>W <a href="https://www.juergenhohnen.de" style="color:#0f4c81;">www.juergenhohnen.de</a><br/>A Industrieparkstraße 4 · 52525 Heinsberg</div></div><p style="margin:20px 0 4px 0;font-size:12px;color:#6b7280;">Folgen Sie uns: <a href="https://www.facebook.com/juergenhohnen/" style="color:#0f4c81;">Facebook</a> · <a href="https://www.instagram.com/hohnen_gmbh/" style="color:#0f4c81;">Instagram</a></p><p style="margin:12px 0 0 0;font-size:11px;color:#9ca3af;line-height:1.5;">Geschäftsführer: Jürgen Hohnen · Sitz: Heinsberg · Handelsregister: HRB 10232 · Amtsgericht Aachen</p></td></tr></table></body></html>';
return {
  json: {
    ...$input.first().json,
    body: {
      ...payload,
      body_html: html,
    },
  },
};`,
    };

    @node({
        id: '7aa6536b-53a4-4922-b531-fee33b46577b',
        name: 'Send Gate',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1824, 272],
    })
    SendGate = {
        jsCode: 'return $input.all().filter((item) => item.json.body?.is_valid === true);',
    };

    @node({
        id: '8dd7edb4-d79d-4a51-a352-191af9a93323',
        webhookId: '44d8472b-293d-4425-bd54-628b30f6d030',
        name: 'Send Email',
        type: 'n8n-nodes-base.microsoftOutlook',
        version: 2,
        position: [1824, 272],
        credentials: {
            microsoftOutlookOAuth2Api: { id: 'f1Xx191p4oB5LCsn', name: 'Juergen Hohnen GmbH (info@juergenhohnen.de)' },
        },
        onError: 'continueErrorOutput',
    })
    SendEmail = {
        toRecipients: '={{$json.body.email}}',
        subject: 'Ihre Wartungserinnerung bei Jürgen Hohnen',
        bodyContent: '={{$json.body.body_html}}',
        additionalFields: {
            bodyContentType: 'HTML',
        },
    };

    @node({
        id: '719f60a0-4ca8-40d0-91a6-acb7f2315155',
        name: 'Handle Send Email Error',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1824, 432],
    })
    HandleSendEmailError = {
        jsCode: `const item = $input.first();
const errSource = item.error ?? item.json?.error ?? {};
const message = typeof errSource === 'string' ? errSource : String(errSource.message ?? errSource.description ?? JSON.stringify(errSource));
const isQuotaError = /ErrorExceededMessageLimit|Daily Message\\/?Recipient limit|RefuseQuota|\\b429\\b/i.test(message);

if (!isQuotaError) {
  throw new Error(message || 'Unknown error sending email');
}

return {
  json: {
    send_status: 'failed_send_limit',
    send_error: message,
    note: 'Outlook send limit hit for info@juergenhohnen.de. Exchange Online allows ~30 messages/minute and 10k recipients/day; the paced batch loop should stay under that. If this recurs, lower the batch size or raise the throttle delay, then resend this reminder manually.',
  },
};`,
    };

    @node({
        id: '44c595e3-38db-4b61-b7d7-ae912b2da440',
        name: 'Build Employee Test Messages',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [480, 512],
    })
    BuildEmployeeTestMessages = {
        jsCode: `const payload = $input.first().json.body ?? {};
const defaultRecipients = [
  'juergen@juergenhohnen.de',
  'fabian@juergenhohnen.de',
  'bz4316@gmail.com',
  'jose@juergenhohnen.de',
  'mario@juergenhohnen.de',
  'justicegsamuel@gmail.com',
];
const providedRecipients = Array.isArray(payload.recipients) ? payload.recipients : [];
const recipients = (providedRecipients.length > 0 ? providedRecipients : defaultRecipients)
  .map((value) => String(value ?? '').trim().toLowerCase())
  .filter(Boolean);
const uniqueRecipients = [...new Set(recipients)];
const companyName = String(payload.company_name ?? 'SolarStar').trim() || 'SolarStar';
const subject = String(payload.subject ?? '[TEST] SolarStar Mitarbeiter-Test').trim() || '[TEST] SolarStar Mitarbeiter-Test';
const heading = String(payload.heading ?? 'SolarStar Mitarbeiter-Test').trim() || 'SolarStar Mitarbeiter-Test';
const message = String(payload.message ?? 'Dies ist eine interne Testnachricht von SolarStar. Bitte nicht antworten.').trim()
  || 'Dies ist eine interne Testnachricht von SolarStar. Bitte nicht antworten.';
const sentAt = new Date().toISOString().slice(0, 10);
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
const bodyHtml = '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>' + escapeHtml(heading) + '</title></head><body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;margin:0 auto;padding:24px;"><tr><td><p style="margin:0 0 16px 0;font-size:20px;font-weight:bold;color:#0f4c81;">' + escapeHtml(heading) + '</p><div style="font-size:16px;line-height:1.7;color:#1f2937;">' + escapeHtml(message) + '</div><p style="margin:20px 0 4px 0;font-size:14px;line-height:1.6;color:#334155;"><strong>Unternehmen:</strong> ' + escapeHtml(companyName) + '<br/><strong>Zweck:</strong> Interner Versandtest am ' + escapeHtml(sentAt) + '</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" /><div style="border-left:3px solid #16a34a;padding-left:12px;"><div style="font-size:16px;font-weight:bold;color:#0f4c81;">Mehmet Yilmaz</div><div style="font-size:13px;color:#16a34a;font-weight:bold;margin-bottom:6px;">Kundendienstleiter</div><div style="font-size:13px;color:#374151;line-height:1.6;">T 02452 89039<br/>E <a href="mailto:mehmet@juergenhohnen.de" style="color:#0f4c81;">mehmet@juergenhohnen.de</a><br/>W <a href="https://www.juergenhohnen.de" style="color:#0f4c81;">www.juergenhohnen.de</a><br/>A Industrieparkstraße 4 · 52525 Heinsberg</div></div><p style="margin:12px 0 0 0;font-size:11px;color:#9ca3af;line-height:1.5;">Geschäftsführer: Jürgen Hohnen · Sitz: Heinsberg · Handelsregister: HRB 10232 · Amtsgericht Aachen</p></td></tr></table></body></html>';

return uniqueRecipients.map((email) => ({
  json: {
    email,
    subject,
    body_html: bodyHtml,
  },
}));`,
    };

    @node({
        id: '699b49e0-8503-4224-9144-f53bc74a9d68',
        webhookId: 'e1965246-f916-4fd4-b617-dceb33125df6',
        name: 'Send Employee Test Email',
        type: 'n8n-nodes-base.microsoftOutlook',
        version: 2,
        position: [768, 512],
        credentials: {
            microsoftOutlookOAuth2Api: { id: 'f1Xx191p4oB5LCsn', name: 'Juergen Hohnen GmbH (info@juergenhohnen.de)' },
        },
        onError: 'continueErrorOutput',
    })
    SendEmployeeTestEmail = {
        toRecipients: '={{$json.email}}',
        subject: '={{$json.subject}}',
        bodyContent: '={{$json.body_html}}',
        additionalFields: {
            bodyContentType: 'HTML',
        },
    };

    @node({
        id: 'a21ddcd7-0a67-432b-a366-1ef798e075c2',
        name: 'Handle Employee Test Send Error',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [768, 672],
    })
    HandleEmployeeTestSendError = {
        jsCode: `const item = $input.first();
const errSource = item.error ?? item.json?.error ?? {};
const message = typeof errSource === 'string' ? errSource : String(errSource.message ?? errSource.description ?? JSON.stringify(errSource));
const isQuotaError = /ErrorExceededMessageLimit|Daily Message\\/?Recipient limit|RefuseQuota|\\b429\\b/i.test(message);

if (!isQuotaError) {
  throw new Error(message || 'Unknown error sending email');
}

return {
  json: {
    send_status: 'failed_send_limit',
    send_error: message,
    note: 'Outlook send limit hit for info@juergenhohnen.de. Exchange Online allows ~30 messages/minute and 10k recipients/day; the paced batch loop should stay under that. If this recurs, lower the batch size or raise the throttle delay, then resend this reminder manually.',
  },
};`,
    };

    @node({
        id: '77f37714-4af0-467f-aa7c-eb1d521fd53d',
        name: 'Prepare Solar Flare Reminders',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [752, 688],
    })
    PrepareSolarFlareReminders = {
        jsCode: `const partners = $input.first().json.data?.company?.partners ?? [];

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Top-priority recipients: always first in the send list, ahead of HERO partners.
const PRIORITY_RECIPIENTS = [
    {
        record_id: 'priority-wilhelm',
        name: 'Wilhelm Brecht',
        email: 'info@wilhelmbrecht.de',
        phone: '+49 176 20093112',
        job_title: '',
        department: 'Solarflare Team',
        in_hero: false,
    },
    {
        record_id: 'priority-justice-samuel',
        name: 'Justice Samuel',
        email: 'justicegsamuel@gmail.com',
        phone: '+491624767479',
        job_title: '',
        department: 'Solarflare Team',
        in_hero: false,
    },
];
const priorityEmails = new Set(PRIORITY_RECIPIENTS.map((r) => r.email.toLowerCase()));

const fromHero = partners
    .map((partner) => ({
        record_id: String(partner.id ?? ''),
        name: String(partner.full_name ?? '').trim(),
        email: String(partner.email ?? '').trim(),
        job_title: String(partner.title ?? '').trim(),
        department: 'Solarflare Team',
        in_hero: true,
    }))
    .filter((record) => record.email && !priorityEmails.has(record.email.toLowerCase()));

const selected = [...PRIORITY_RECIPIENTS, ...fromHero];

return selected.map((record) => {
    // Employee reminder uses the customer-facing template format so staff
    // preview exactly what customers will receive.
    const SUPPORT_PHONE = '0178 2801200';

    const firstName = record.name.split(/\\s+/)[0] || record.name;

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 3);
    const dueDateFormatted = dueDate.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/Berlin',
    });

    // Optional kWp line: only rendered when system size data is available.
    const systemSizeKwp = record.system_size_kwp ?? null;
    const systemSizeLine = systemSizeKwp
        ? 'Ihre ' + systemSizeKwp + '-kWp-Anlage profitiert besonders von einer regelmäßigen Kontrolle.<br/><br/>'
        : '';

    const subject = 'Erinnerung: Wartung Ihrer Solaranlage bis ' + dueDateFormatted;
    const bodyHtml = '<!DOCTYPE html><html lang="de"><body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;margin:0 auto;padding:24px;"><tr><td><p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">Hallo ' + escapeHtml(firstName) + ',</p><div style="font-size:16px;line-height:1.7;color:#1f2937;">Ihre Solaranlage braucht wieder Aufmerksamkeit.<br/><br/>Spätestens in 3 Monaten (bis ' + escapeHtml(dueDateFormatted) + ') ist die reguläre Wartung fällig – das sichert die optimale Leistung und schließt Ausfallrisiken aus.<br/><br/>' + systemSizeLine + 'Was wir machen:<br/>&rarr; Kontrolle aller Komponenten<br/>&rarr; Ertragsoptimierung<br/>&rarr; Schnelle Behebung von Mängeln<br/><br/>Vereinbaren Sie Ihren Wunschtermin bequem online über den Button unten oder telefonisch unter ' + escapeHtml(SUPPORT_PHONE) + '.</div><p style="margin:24px 0;"><a href="https://www.juergenhohnen.de/termin-vereinbaren/" style="display:inline-block;background-color:#0f4c81;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:bold;">Termin vereinbaren</a></p><p style="margin:24px 0 4px 0;font-size:15px;">Beste Grüße aus Heinsberg<br/>Jürgen Hohnen GmbH</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" /><div style="border-left:3px solid #16a34a;padding-left:12px;"><div style="font-size:16px;font-weight:bold;color:#0f4c81;">Mehmet Yilmaz</div><div style="font-size:13px;color:#16a34a;font-weight:bold;margin-bottom:6px;">Kundendienstleiter</div><div style="font-size:13px;color:#374151;line-height:1.6;">T 02452 89039<br/>E <a href="mailto:mehmet@juergenhohnen.de" style="color:#0f4c81;">mehmet@juergenhohnen.de</a><br/>W <a href="https://www.juergenhohnen.de" style="color:#0f4c81;">www.juergenhohnen.de</a><br/>A Industrieparkstraße 4 · 52525 Heinsberg</div></div><p style="margin:20px 0 4px 0;font-size:12px;color:#6b7280;">Folgen Sie uns: <a href="https://www.facebook.com/juergenhohnen/" style="color:#0f4c81;">Facebook</a> · <a href="https://www.instagram.com/hohnen_gmbh/" style="color:#0f4c81;">Instagram</a></p><p style="margin:12px 0 0 0;font-size:11px;color:#9ca3af;line-height:1.5;">Geschäftsführer: Jürgen Hohnen · Sitz: Heinsberg · Handelsregister: HRB 10232 · Amtsgericht Aachen</p></td></tr></table></body></html>';

    return {
        json: {
            ...record,
            subject,
            body_html: bodyHtml,
        },
    };
});`,
    };

    @node({
        id: '1b855846-f95c-4267-b133-a8e02110f5d5',
        name: 'Report Reminder Coverage',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [752, 832],
    })
    ReportReminderCoverage = {
        jsCode: `const partners = $input.first().json.data?.company?.partners ?? [];

const found = [];
const missing = [];
for (const partner of partners) {
    const record = {
        record_id: String(partner.id ?? ''),
        name: String(partner.full_name ?? '').trim(),
        email: String(partner.email ?? '').trim(),
        job_title: String(partner.title ?? '').trim(),
        department: 'Solarflare Team',
    };
    if (record.email) {
        found.push(record);
    } else {
        missing.push(record);
    }
}

const report = {
    timestamp: new Date().toISOString(),
    target_count: partners.length,
    found_count: found.length,
    missing_count: missing.length,
    found,
    missing,
};

console.log('SolarFlareReminderCoverage', JSON.stringify(report));
return [{ json: report }];`,
    };

    @node({
        id: '22bac7ba-42e2-4876-b0f1-9df1b474341f',
        name: 'Pace Solar Flare Batches',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [976, 688],
    })
    PaceSolarFlareBatches = {
        batchSize: 10,
        options: {},
    };

    @node({
        id: '58472fa5-f341-4a61-93f8-c73de79474f8',
        webhookId: 'db4f037d-c3a0-420e-b17b-a8837e8ca258',
        name: 'Send Solar Flare Reminder',
        type: 'n8n-nodes-base.microsoftOutlook',
        version: 2,
        position: [1200, 688],
        credentials: {
            microsoftOutlookOAuth2Api: { id: 'f1Xx191p4oB5LCsn', name: 'Juergen Hohnen GmbH (info@juergenhohnen.de)' },
        },
        onError: 'continueErrorOutput',
        alwaysOutputData: true,
        retryOnFail: true,
        maxTries: 3,
        waitBetweenTries: 5000,
    })
    SendSolarFlareReminder = {
        toRecipients: '={{$json.email}}',
        subject: '={{$json.subject}}',
        bodyContent: '={{$json.body_html}}',
        additionalFields: {
            bodyContentType: 'HTML',
        },
    };

    @node({
        id: '7db5d0d6-051f-4b41-9876-2d90a478a8dd',
        webhookId: '008cc052-7241-4fa5-8361-fede5900e983',
        name: 'Throttle Solar Flare Send',
        type: 'n8n-nodes-base.wait',
        version: 1.1,
        position: [1424, 688],
    })
    ThrottleSolarFlareSend = {
        resume: 'timeInterval',
        amount: 30,
        unit: 'seconds',
    };

    @node({
        id: 'e426abc3-062e-4584-84d3-dc70d433155c',
        name: 'Handle Solar Flare Send Error',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1200, 848],
    })
    HandleSolarFlareSendError = {
        jsCode: `const item = $input.first();
const errSource = item.error ?? item.json?.error ?? {};
const message = typeof errSource === 'string' ? errSource : String(errSource.message ?? errSource.description ?? JSON.stringify(errSource));
const isQuotaError = /ErrorExceededMessageLimit|Daily Message\\/?Recipient limit|RefuseQuota|\\b429\\b/i.test(message);

if (!isQuotaError) {
  throw new Error(message || 'Unknown error sending email');
}

return {
  json: {
    send_status: 'failed_send_limit',
    send_error: message,
    note: 'Outlook send limit hit for info@juergenhohnen.de. Exchange Online allows ~30 messages/minute and 10k recipients/day; the paced batch loop should stay under that. If this recurs, lower the batch size or raise the throttle delay, then resend this reminder manually.',
  },
};`,
    };

    @node({
        id: '4ed03870-0955-420c-82a5-f2bdfc1efb4c',
        name: 'Invalid For Manual Follow-up',
        type: 'n8n-nodes-base.noOp',
        version: 1,
        position: [1392, 512],
    })
    InvalidForManualFollowUp = {};

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.TestTrigger.out(0).to(this.CustomerData.in(0));
        this.EmployeeTestTrigger.out(0).to(this.BuildEmployeeTestMessages.in(0));
        this.ScheduleTrigger.out(0).to(this.CustomerData.in(0));
        this.EmployeeReminderSchedule.out(0).to(this.HeroCompanyPartners.in(0));
        this.CustomerData.out(0).to(this.MapHeroCustomers.in(0));
        this.HeroCompanyPartners.out(0).to(this.PrepareSolarFlareReminders.in(0));
        this.HeroCompanyPartners.out(0).to(this.ReportReminderCoverage.in(0));
        this.MapHeroCustomers.out(0).to(this.GenerateEmail.in(0));
        this.MapHeroCustomers.out(0).to(this.AttachCustomerFields.in(0));
        this.GenerateEmail.out(0).to(this.AttachCustomerFields.in(1));
        this.AttachCustomerFields.out(0).to(this.Validate.in(0));
        this.Validate.out(0).to(this.HumanReview.in(0));
        this.Validate.out(0).to(this.InvalidForManualFollowUp.in(0));
        this.HumanReview.out(0).to(this.ComposeHtmlEmail.in(0));
        this.ComposeHtmlEmail.out(0).to(this.SendGate.in(0));
        this.SendGate.out(0).to(this.SendEmail.in(0));
        this.SendEmail.out(1).to(this.HandleSendEmailError.in(0));
        this.BuildEmployeeTestMessages.out(0).to(this.SendEmployeeTestEmail.in(0));
        this.SendEmployeeTestEmail.out(1).to(this.HandleEmployeeTestSendError.in(0));
        this.PrepareSolarFlareReminders.out(0).to(this.PaceSolarFlareBatches.in(0));
        this.PaceSolarFlareBatches.out(1).to(this.SendSolarFlareReminder.in(0));
        this.SendSolarFlareReminder.out(0).to(this.ThrottleSolarFlareSend.in(0));
        this.SendSolarFlareReminder.out(1).to(this.HandleSolarFlareSendError.in(0));
        this.ThrottleSolarFlareSend.out(0).to(this.PaceSolarFlareBatches.in(0));
    }
}
