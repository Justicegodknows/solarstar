import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Linkedin-automation
// Nodes   : 4  |  Connections: 3
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ScheduleTrigger                    scheduleTrigger
// SearchDecisionMakers               httpRequest                [creds]
// FormatLeads                        code
// SendOutreach                       httpRequest
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ScheduleTrigger
//    → SearchDecisionMakers
//      → FormatLeads
//        → SendOutreach
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'Isjcq3vslG3jCgYA',
    name: 'Linkedin-automation',
    active: false,
    isArchived: false,
    settings: { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: false },
})
export class LinkedinAutomationWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '833a483c-216e-435c-803a-d8f69d930828',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.3,
        position: [0, 0],
    })
    ScheduleTrigger = {
        rule: {
            interval: [
                {
                    triggerAtHour: 9,
                    triggerAtMinute: 1,
                },
            ],
        },
    };

    @node({
        id: '4da51220-48a7-4c34-95e6-799b83d30dc7',
        name: 'Search Decision Makers',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [240, 0],
        credentials: { httpHeaderAuth: { id: 'TyIBios1CmRBlI9R', name: 'RapidAPI LinkedIn Key' } },
    })
    SearchDecisionMakers = {
        method: 'POST',
        url: 'https://fresh-linkedin-profile-data.p.rapidapi.com/search-decision-makers',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'X-Rapidapi-Host',
                    value: 'fresh-linkedin-profile-data.p.rapidapi.com',
                },
                {
                    name: 'Content-Type',
                    value: 'application/json',
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody:
            '={"geo_codes":[105365761],"title_keywords":["CEO","CFO","CTO","COO","Founder","Co-Founder","Managing Director","Owner","President","Director General"],"limit":"25"}',
        options: {
            response: {
                response: {
                    neverError: true,
                },
            },
        },
    };

    @node({
        id: '64338b73-1ec9-45d3-8060-3ca55a06f977',
        name: 'Format Leads',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [480, 0],
    })
    FormatLeads = {
        mode: 'runOnceForAllItems',
        language: 'javaScript',
        jsCode: `const leads = [];

for (const item of $input.all()) {
  const body = item.json;

  // Guard: API not subscribed or no data
  if (!body || body.message || !body.items) {
    console.log('search-decision-makers returned no data:', body?.message ?? JSON.stringify(body).slice(0,200));
    continue;
  }

  for (const p of (body.items ?? [])) {
    const fullName   = p.fullName   ?? [p.firstName, p.lastName].filter(Boolean).join(' ');
    const headline   = p.headline   ?? p.title       ?? '';
    const location   = p.location   ?? p.geoRegion   ?? '';
    const profileUrl = p.profileURL ?? p.url         ?? (p.publicIdentifier ? 'https://www.linkedin.com/in/' + p.publicIdentifier + '/' : '');
    const company    = p.companyName ?? p.company    ?? '';
    const firstName  = fullName.split(' ')[0] || 'there';

    if (!profileUrl) continue;

    leads.push({
      json: {
        fullName,
        headline,
        location,
        company,
        profileUrl,
        message:
          'Hello ' + firstName + ',\\\\n\\\\n' +
          'I came across your profile as ' + headline + (company ? ' at ' + company : '') + '. ' +
          'At Afrodock we help Nigerian businesses like yours streamline operations and grow. ' +
          'I would love to connect and explore how we could add value to ' + (company || 'your work') + '.\\\\n\\\\n' +
          'Best regards,\\\\nAfrodock Team',
      },
    });
  }
}

return leads.length ? leads : [{ json: { status: 'no_leads', reason: 'API returned 0 matching decision-makers' } }];`,
    };

    @node({
        id: '6da4d6eb-dc11-481f-825c-14df7057adc4',
        name: 'Send Outreach',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [720, 0],
    })
    SendOutreach = {
        method: 'POST',
        url: 'https://example.com/REPLACE-WITH-YOUR-OUTREACH-ENDPOINT',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify($json) }}',
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ScheduleTrigger.out(0).to(this.SearchDecisionMakers.in(0));
        this.SearchDecisionMakers.out(0).to(this.FormatLeads.in(0));
        this.FormatLeads.out(0).to(this.SendOutreach.in(0));
    }
}
