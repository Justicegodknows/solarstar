import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : SolarStar Phase 1 - Wartungs-Erinnerungen
// Nodes   : 10  |  Connections: 10
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// TestTrigger                        webhook
// ScheduleTrigger                    scheduleTrigger
// CustomerData                       code
// GenerateEmail                      httpRequest
// AttachCustomerFields               merge
// Validate                           code
// HumanReview                        wait
// SendGate                           code
// SendEmail                          noOp
// InvalidForManualFollowUp           noOp
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// TestTrigger
//    → CustomerData
//      → GenerateEmail
//        → AttachCustomerFields.in(1)
//          → Validate
//            → HumanReview
//              → SendGate
//                → SendEmail
//            → InvalidForManualFollowUp
//      → AttachCustomerFields (↩ loop)
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
        id: '50926bd3-0dac-4995-a68b-32394de26dda',
        name: 'Customer Data',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [460, 260],
    })
    CustomerData = {
        mode: 'runOnceForAllItems',
        language: 'javaScript',
        jsCode: `return [
  {
    json: {
      customer_name: 'Anna Schneider',
      email: 'anna.schneider@example.de',
      equipment_type: 'Pelletheizung',
      last_service_date: '2025-11-20',
      voucher_eligible: true,
    },
  },
  {
    json: {
      customer_name: 'Mehmet Yilmaz',
      email: 'mehmet.yilmaz@example.de',
      equipment_type: 'Waermepumpe',
      last_service_date: '2025-10-08',
      voucher_eligible: false,
    },
  },
  {
    json: {
      customer_name: 'Julia Becker',
      email: 'julia.becker@example.de',
      equipment_type: 'Gasheizung',
      last_service_date: '2025-09-14',
      voucher_eligible: true,
    },
  },
];`,
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
        jsonBody: `={
  "model": "mistral",
  "stream": false,
  "prompt": "Du bist Assistent fuer SolarStar (deutscher Heizungsbetrieb). Schreibe eine kurze, freundliche Wartungserinnerung auf Deutsch. Nutze nur diese Daten und erfinde nichts: Name: " + $json.customer_name + ", Anlagentyp: " + $json.equipment_type + ", Letzte Wartung: " + $json.last_service_date + ", Gutscheinberechtigt: " + ($json.voucher_eligible ? "ja" : "nein") + ". Anforderungen: 1) Beginne mit der direkten Anrede und dem Vornamen der Person. 2) 90-160 Woerter. 3) Wenn Gutscheinberechtigt=ja, nenne einen Wartungsgutschein freundlich. 4) Keine Preiszusagen, keine nicht vorhandenen Details. 5) Klarer Call-to-Action fuer Terminvereinbarung bei SolarStar.",
  "options": {
    "temperature": 0.3
  }
}`,
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
        jsCode: 'return $input.all().filter((item) => item.json.is_valid === true);',
    };

    @node({
        id: '8dd7edb4-d79d-4a51-a352-191af9a93323',
        webhookId: '1a44c810-34ff-4d6f-bef6-e8bf5c559684',
        name: 'Send Email',
        type: 'n8n-nodes-base.noOp',
        version: 1,
        position: [1820, 260],
    })
    SendEmail = {};

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
        this.ScheduleTrigger.out(0).to(this.CustomerData.in(0));
        this.CustomerData.out(0).to(this.GenerateEmail.in(0));
        this.CustomerData.out(0).to(this.AttachCustomerFields.in(0));
        this.GenerateEmail.out(0).to(this.AttachCustomerFields.in(1));
        this.AttachCustomerFields.out(0).to(this.Validate.in(0));
        this.Validate.out(0).to(this.HumanReview.in(0));
        this.Validate.out(0).to(this.InvalidForManualFollowUp.in(0));
        this.HumanReview.out(0).to(this.SendGate.in(0));
        this.SendGate.out(0).to(this.SendEmail.in(0));
    }
}
