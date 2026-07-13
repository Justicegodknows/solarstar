import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SolarStar Phase 1 - Wartungs-Erinnerungen
// Nodes   : 19  |  Connections: 19
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// TestTrigger                        webhook
// EmployeeTestTrigger                webhook
// ScheduleTrigger                    scheduleTrigger
// EmployeeReminderSchedule            scheduleTrigger
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
// EmployeeReminderSchedule
//    → HeroCompanyPartners
//      → PrepareSolarFlareReminders
//      → ReportReminderCoverage
//        → SendSolarFlareReminder
// ScheduleTrigger
//    → CustomerData (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'TyzTNzhz9QuLKNiH',
    name: 'SolarStar Phase 1 - Wartungs-Erinnerungen',
    active: false,
    isArchived: false,
    settings: { executionOrder: 'v1' },
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
        position: [220, 160],
    })
    TestTrigger = {
        responseBinaryPropertyName: 'data',
        httpMethod: 'POST',
        path: 'solarstar-phase1-test',
        authentication: 'none',
        responseMode: 'onReceived',
        responseCode: 200,
    };

    @node({
        id: '9b730f2a-5a70-46f6-a2e5-2a98fbec62ee',
        webhookId: '7a7f4f6b-3a24-4688-a303-b87ec6ef9886',
        name: 'Employee Test Trigger',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [220, 500],
    })
    EmployeeTestTrigger = {
        responseBinaryPropertyName: 'data',
        httpMethod: 'POST',
        path: 'solarstar-employee-test',
        authentication: 'none',
        responseMode: 'onReceived',
        responseCode: 200,
    };

    @node({
        id: 'c84cbf6a-0790-4136-a901-bec4c4706446',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [220, 320],
    })
    ScheduleTrigger = {
        rule: {
            interval: [
                {
                    field: 'minutes',
                    minutesInterval: 1,
                },
            ],
        },
    };

    @node({
        id: '430fb8de-8a33-4fbb-bd0b-c2f5fd9fdbb8',
        name: 'Employee Reminder Schedule',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [220, 680],
    })
    EmployeeReminderSchedule = {
        rule: {
            interval: [
                {
                    field: 'days',
                    daysInterval: 1,
                    triggerAtHour: '13',
                    triggerAtMinute: 0,
                },
            ],
        },
    };

    @node({
        id: '50926bd3-0dac-4995-a68b-32394de26dda',
        name: 'Customer Data',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [460, 260],
        credentials: { httpHeaderAuth: { id: 'bsL1r7l7hguXNpjs', name: 'HERO API (read-only)' } },
    })
    CustomerData = {
        method: 'POST',
        url: 'https://login.hero-software.de/api/external/v7/graphql',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendBody: true,
        contentType: 'json',
        specifyBody: 'json',
        jsonBody:
            '={"query": "query GetDueMaintenance($start: DateTime, $end: DateTime) { field_service_jobs(start: $start, end: $end, first: 200) { id type start title customer { id full_name email } } }", "variables": {"start": "{{$now.minus({days:380}).toISO()}}", "end": "{{$now.minus({days:350}).toISO()}}"}}',
    };

    @node({
        id: '36ca0fd6-6e21-4eb9-993f-7f6f4349fc51',
        name: 'HERO Company Partners',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [480, 680],
        credentials: { httpHeaderAuth: { id: 'bsL1r7l7hguXNpjs', name: 'HERO API (read-only)' } },
    })
    HeroCompanyPartners = {
        method: 'POST',
        url: 'https://login.hero-software.de/api/external/v7/graphql',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendBody: true,
        contentType: 'json',
        specifyBody: 'json',
        jsonBody:
            '={"query":"query CompanyPartnersForSolarFlareReminder { company { partners { id full_name email title role account_type status } } }"}',
    };

    @node({
        id: '1ece3681-5571-46f5-88ee-8601ee53a9e1',
        name: 'Map HERO Customers',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [580, 260],
    })
    MapHeroCustomers = {
        mode: 'runOnceForAllItems',
        language: 'javaScript',
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
        position: [700, 260],
    })
    GenerateEmail = {
        method: 'POST',
        url: 'http://172.17.0.1:11434/api/generate',
        authentication: 'none',
        sendBody: true,
        contentType: 'json',
        specifyBody: 'json',
        jsonBody:
            '={"model": "mistral", "stream": false, "prompt": "Du bist Assistent fuer SolarStar (deutscher Heizungsbetrieb). Schreibe eine kurze, freundliche Wartungserinnerung auf Deutsch. Nutze nur diese Daten und erfinde nichts: Name: {{$json.customer_name}}, Anlagentyp: {{$json.equipment_type}}, Letzte Wartung: {{$json.last_service_date}}. Anforderungen: 1) Beginne mit der direkten Anrede und dem Vornamen der Person. 2) 90-160 Woerter. 3) Keine Preiszusagen, keine nicht vorhandenen Details, keine Erwaehnung von Gutscheinen. 4) Klarer Call-to-Action fuer Terminvereinbarung bei SolarStar.", "options": {"temperature": 0.3}}',
    };

    @node({
        id: '08715515-1cdd-4187-9abd-294d11442001',
        name: 'Attach Customer Fields',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [940, 260],
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
        position: [1160, 260],
    })
    Validate = {
        mode: 'runOnceForEachItem',
        language: 'javaScript',
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
        position: [1380, 260],
    })
    HumanReview = {
        resume: 'webhook',
        incomingAuthentication: 'none',
        dateTime: '={{$now.plus({hours: 1}).toISO()}}',
        formTitle: 'Freigabe Kundenmail',
        responseBinaryPropertyName: 'data',
        httpMethod: 'POST',
    };

    @node({
        id: '7aa6536b-53a4-4922-b531-fee33b46577b',
        name: 'Send Gate',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1600, 260],
    })
    SendGate = {
        mode: 'runOnceForAllItems',
        language: 'javaScript',
        // Human Review resumes via a webhook, which wraps the approval payload under `.body`
        // (n8n always nests incoming webhook JSON as { headers, params, query, body }).
        jsCode: 'return $input.all().filter((item) => item.json.body?.is_valid === true);',
    };

    @node({
        id: '8dd7edb4-d79d-4a51-a352-191af9a93323',
        webhookId: '44d8472b-293d-4425-bd54-628b30f6d030',
        name: 'Send Email',
        type: 'n8n-nodes-base.microsoftOutlook',
        version: 2,
        position: [1820, 260],
        credentials: {
            microsoftOutlookOAuth2Api: {
                id: 'CWeYIuXpSepKw28k',
                name: 'SolarStar Service Mailbox (solarstar2@outlook.com)',
            },
        },
    })
    SendEmail = {
        resource: 'message',
        operation: 'send',
        // Fields come from the Human Review resume webhook body (see Send Gate comment above).
        toRecipients: '={{$json.body.email}}',
        subject: 'Ihre Wartungserinnerung von SolarStar',
        bodyContent: '={{$json.body.generated_email_text}}',
        additionalFields: {
            bodyContentType: 'Text',
        },
    };

    @node({
        id: '44c595e3-38db-4b61-b7d7-ae912b2da440',
        name: 'Build Employee Test Messages',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [480, 500],
    })
    BuildEmployeeTestMessages = {
        mode: 'runOnceForAllItems',
        language: 'javaScript',
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
        position: [760, 500],
        credentials: {
            microsoftOutlookOAuth2Api: {
                id: 'CWeYIuXpSepKw28k',
                name: 'SolarStar Service Mailbox (solarstar2@outlook.com)',
            },
        },
    })
    SendEmployeeTestEmail = {
        resource: 'message',
        operation: 'send',
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
                position: [740, 680],
        })
        PrepareSolarFlareReminders = {
                mode: 'runOnceForAllItems',
                language: 'javaScript',
                jsCode: `const partners = $input.first().json.data?.company?.partners ?? [];
const requestedRecords = [
    {
        record_id: 'Employee1',
        name: 'Yusuf Can',
        email: 'yusuf@juergenhohnen.de',
        job_title: 'Assistent der Geschaeftsleitung',
        department: 'Geschaeftsleitung',
        responsibilities: 'Lohnbuchhaltungen, Zielauswertungen',
        phone: ['0176 42933616', '02452 92449624'],
    },
    {
        record_id: 'Employee2',
        name: 'Mehmet Yilmaz',
        email: 'mehmet@juergenhohnen.de',
        job_title: 'Leiter Kundendienst',
        department: 'Kundendienst',
        responsibilities: 'Wartungsplanungen',
        phone: ['0178 2801200'],
    },
    {
        record_id: 'Employee3',
        name: 'David Homan',
        email: 'david@juergenhohnen.de',
        job_title: 'Leiter Pelletvertrieb Team Hohnen',
        department: 'Pelletvertrieb Team Hohnen',
        responsibilities: '',
        phone: ['01511 4184734'],
    },
];

const normalize = (value) =>
    String(value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const findPartner = (record) => {
    const expectedName = normalize(record.name);
    const expectedEmail = normalize(record.email);
    const expectedTitle = normalize(record.job_title);

    return partners.find((partner) => {
        const fullName = normalize(partner.full_name);
        const email = normalize(partner.email);
        const title = normalize(partner.title);

        if (expectedEmail && email && expectedEmail === email) return true;
        if (expectedName && fullName && expectedName === fullName) return true;
        if (expectedTitle && title && title.includes(expectedTitle)) return true;
        return false;
    });
};

const selected = requestedRecords
    .map((record) => {
        const partner = findPartner(record);
        return {
            record_id: record.record_id,
            name: partner?.full_name || record.name || '',
            email: partner?.email || record.email || '',
            job_title: record.job_title || partner?.title || '',
            department: record.department || 'Solarflare Team',
            responsibilities: record.responsibilities || '',
            phone: Array.isArray(record.phone) ? record.phone : (record.phone ? [record.phone] : []),
            in_hero: Boolean(partner),
        };
    })
    .filter((record) => record.email);

return selected.map((record) => {
    const subject = 'Solarflare-Check Erinnerung fuer ' + record.department;
    const responsibilitiesLine = record.responsibilities
        ? 'Zustaendigkeit: ' + record.responsibilities + '\n'
        : '';
    const body =
        'Sehr geehrte/r ' + record.name + ',\n\n' +
        'dies ist Ihre taegliche Erinnerung, den Solarflare-Status zu pruefen.\n\n' +
        'Position: ' + record.job_title + '\n' +
        'Abteilung: ' + record.department + '\n' +
        responsibilitiesLine + '\n' +
        'Bitte bestaetigen Sie den Abschluss des Checks im vorgesehenen Teamprozess.\n\n' +
        'Mit freundlichen Gruessen\nSolarStar Automatisierung';

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
                position: [740, 820],
        })
        ReportReminderCoverage = {
                mode: 'runOnceForAllItems',
                language: 'javaScript',
                jsCode: `const partners = $input.first().json.data?.company?.partners ?? [];
const requestedRecords = [
    {
        record_id: 'Employee1',
        name: 'Yusuf Can',
        email: 'yusuf@juergenhohnen.de',
        job_title: 'Assistent der Geschaeftsleitung',
        department: 'Geschaeftsleitung',
        responsibilities: 'Lohnbuchhaltungen, Zielauswertungen',
        phone: ['0176 42933616', '02452 92449624'],
    },
    {
        record_id: 'Employee2',
        name: 'Mehmet Yilmaz',
        email: 'mehmet@juergenhohnen.de',
        job_title: 'Leiter Kundendienst',
        department: 'Kundendienst',
        responsibilities: 'Wartungsplanungen',
        phone: ['0178 2801200'],
    },
    {
        record_id: 'Employee3',
        name: 'David Homan',
        email: 'david@juergenhohnen.de',
        job_title: 'Leiter Pelletvertrieb Team Hohnen',
        department: 'Pelletvertrieb Team Hohnen',
        responsibilities: '',
        phone: ['01511 4184734'],
    },
];

const normalize = (value) =>
    String(value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const findPartner = (record) => {
    const expectedName = normalize(record.name);
    const expectedEmail = normalize(record.email);
    const expectedTitle = normalize(record.job_title);

    return partners.find((partner) => {
        const fullName = normalize(partner.full_name);
        const email = normalize(partner.email);
        const title = normalize(partner.title);

        if (expectedEmail && email && expectedEmail === email) return true;
        if (expectedName && fullName && expectedName === fullName) return true;
        if (expectedTitle && title && title.includes(expectedTitle)) return true;
        return false;
    });
};

const found = [];
const missing = [];
for (const record of requestedRecords) {
    const partner = findPartner(record);
    if (partner) {
        found.push({
            record_id: record.record_id,
            name: partner.full_name || record.name || '',
            email: partner.email || record.email || '',
            job_title: record.job_title || partner.title || '',
            department: record.department || 'Solarflare Team',
            responsibilities: record.responsibilities || '',
            phone: Array.isArray(record.phone) ? record.phone : (record.phone ? [record.phone] : []),
        });
    } else {
        missing.push({
            record_id: record.record_id,
            name: record.name || '',
            email: record.email || '',
            job_title: record.job_title || '',
            department: record.department || 'Solarflare Team',
            responsibilities: record.responsibilities || '',
            phone: Array.isArray(record.phone) ? record.phone : (record.phone ? [record.phone] : []),
        });
    }
}

const report = {
    timestamp: new Date().toISOString(),
    target_count: requestedRecords.length,
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
                position: [980, 680],
                credentials: {
                        microsoftOutlookOAuth2Api: {
                                id: 'CWeYIuXpSepKw28k',
                                name: 'SolarStar Service Mailbox (solarstar2@outlook.com)',
                        },
                },
        })
        SendSolarFlareReminder = {
                resource: 'message',
                operation: 'send',
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
        position: [1380, 500],
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
