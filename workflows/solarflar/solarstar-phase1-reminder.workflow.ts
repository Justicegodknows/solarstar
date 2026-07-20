import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SolarStar Phase 1 - Wartungs-Erinnerungen
// Nodes   : 19  |  Connections: 17
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// TestTrigger                        webhook
// EmployeeTestTrigger                webhook
// ScheduleTrigger                    scheduleTrigger
// EmployeeReminderSchedule           scheduleTrigger
// CustomerData                       httpRequest                [creds]
// HeroCompanyPartners                httpRequest                [creds]
// MapHeroCustomers                   code
// GenerateEmail                      httpRequest
// AttachCustomerFields               merge
// Validate                           code
// HumanReview                        wait
// SendGate                           code
// SendEmail                          microsoftOutlook           [creds]
// BuildEmployeeTestMessages          code
// SendEmployeeTestEmail              microsoftOutlook           [creds]
// PrepareSolarFlareReminders         code
// ReportReminderCoverage             code
// SendSolarFlareReminder             microsoftOutlook           [creds]
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
//                → SendGate
//                  → SendEmail
//              → InvalidForManualFollowUp
//        → AttachCustomerFields (↩ loop)
// EmployeeTestTrigger
//    → BuildEmployeeTestMessages
//      → SendEmployeeTestEmail
// ScheduleTrigger
//    → CustomerData (↩ loop)
// EmployeeReminderSchedule
//    → HeroCompanyPartners
//      → PrepareSolarFlareReminders
//        → SendSolarFlareReminder
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
    })
    EmployeeReminderSchedule = {
        rule: {
            interval: [{}],
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
            '={"model": "mistral", "stream": false, "prompt": "Du bist Assistent fuer SolarStar (deutscher Heizungsbetrieb). Schreibe eine kurze, freundliche Wartungserinnerung auf Deutsch. Nutze nur diese Daten und erfinde nichts: Name: {{$json.customer_name}}, Anlagentyp: {{$json.equipment_type}}, Letzte Wartung: {{$json.last_service_date}}. Anforderungen: 1) Beginne mit der direkten Anrede und dem Vornamen der Person. 2) 90-160 Woerter. 3) Keine Preiszusagen, keine nicht vorhandenen Details, keine Erwaehnung von Gutscheinen. 4) Klarer Call-to-Action fuer Terminvereinbarung bei SolarStar. 5) Erwaehne keine Telefonnummern oder E-Mail-Adressen; die Kontaktdaten des Ansprechpartners werden automatisch ergaenzt.", "options": {"temperature": 0.3}}',
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
    review_reason: isValid ? '' : 'Text fehlt, ist zu kurz/zu lang oder enthaelt den Vornamen nicht.',
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
        id: '7aa6536b-53a4-4922-b531-fee33b46577b',
        name: 'Send Gate',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1600, 272],
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
    })
    SendEmail = {
        toRecipients: '={{$json.body.email}}',
        subject: 'Ihre Wartungserinnerung von SolarStar',
        bodyContent: `={{$json.body.generated_email_text}}

Ihr Ansprechpartner fuer die Wartungsplanung:
Mehmet Yilmaz - Leiter Kundendienst
Telefon: 0178 2801200
E-Mail: mehmet@juergenhohnen.de`,
        additionalFields: {
            bodyContentType: 'Text',
        },
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
const bodyHtml = '<h1>' + heading + '</h1><p>' + message + '</p><p><strong>Unternehmen:</strong> ' + companyName + '<br><strong>Zweck:</strong> Interner Versandtest am ' + sentAt + '</p>';

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
        id: '77f37714-4af0-467f-aa7c-eb1d521fd53d',
        name: 'Prepare Solar Flare Reminders',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [752, 688],
    })
    PrepareSolarFlareReminders = {
        jsCode: `const partners = $input.first().json.data?.company?.partners ?? [];

const selected = partners
    .map((partner) => ({
        record_id: String(partner.id ?? ''),
        name: String(partner.full_name ?? '').trim(),
        email: String(partner.email ?? '').trim(),
        job_title: String(partner.title ?? '').trim(),
        department: 'Solarflare Team',
        in_hero: true,
    }))
    .filter((record) => record.email);

// Daily send cap: the consumer mailbox (info@juergenhohnen.de) is quota-limited
// (429 ErrorExceededMessageLimit). Keep well under the unverified-account limit.
const MAX_DAILY_RECIPIENTS = 10;
const capped = selected.slice(0, MAX_DAILY_RECIPIENTS);
if (selected.length > capped.length) {
    console.log('SolarFlareReminderCap', JSON.stringify({
        total_eligible: selected.length,
        sent_cap: MAX_DAILY_RECIPIENTS,
        skipped: selected.length - capped.length,
    }));
}

return capped.map((record) => {
    const subject = 'Testmail';
    const positionLine = record.job_title ? 'Position: ' + record.job_title + '\\n' : '';
    const body =
        'Sehr geehrte/r ' + record.name + ',\\n\\n' +
        'diese E-Mail dient dazu, unser Automatisierungssystem zu testen.\\n\\n' +
        positionLine +
        'Abteilung: ' + record.department + '\\n\\n' +
        'Mit freundlichen Gruessen\\nSolarStar Automatisierung';

    return {
        json: {
            ...record,
            subject,
            body,
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
        id: '58472fa5-f341-4a61-93f8-c73de79474f8',
        webhookId: 'db4f037d-c3a0-420e-b17b-a8837e8ca258',
        name: 'Send Solar Flare Reminder',
        type: 'n8n-nodes-base.microsoftOutlook',
        version: 2,
        position: [992, 688],
        credentials: {
            microsoftOutlookOAuth2Api: { id: 'f1Xx191p4oB5LCsn', name: 'Juergen Hohnen GmbH (info@juergenhohnen.de)' },
        },
    })
    SendSolarFlareReminder = {
        toRecipients: '={{$json.email}}',
        subject: '={{$json.subject}}',
        bodyContent: '={{$json.body}}',
        additionalFields: {
            bodyContentType: 'Text',
        },
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
        this.HumanReview.out(0).to(this.SendGate.in(0));
        this.SendGate.out(0).to(this.SendEmail.in(0));
        this.BuildEmployeeTestMessages.out(0).to(this.SendEmployeeTestEmail.in(0));
        this.PrepareSolarFlareReminders.out(0).to(this.SendSolarFlareReminder.in(0));
    }
}
