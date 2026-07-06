import fs from 'node:fs';

const settings = JSON.parse(fs.readFileSync('/home/admin/solarstar/.vscode/settings.json', 'utf8'));
const apiKey = settings['n8nMcp.apiKey'];
const workflowId = 'TyzTNzhz9QuLKNiH';
const baseUrl = 'http://localhost:5678/api/v1';

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} failed: ${response.status} ${response.statusText} :: ${JSON.stringify(json)}`);
  }

  return json;
}

const current = await api(`/workflows/${workflowId}`);

const hasEmployeeTestTrigger = current.nodes.some((n) => n.name === 'Employee Test Trigger');
const hasBuildNode = current.nodes.some((n) => n.name === 'Build Employee Test Messages');
const hasSendNode = current.nodes.some((n) => n.name === 'Send Employee Test Email');

if (!hasEmployeeTestTrigger) {
  current.nodes.push({
    id: '9b730f2a-5a70-46f6-a2e5-2a98fbec62ee',
    webhookId: '7a7f4f6b-3a24-4688-a303-b87ec6ef9886',
    name: 'Employee Test Trigger',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2.1,
    position: [224, 500],
    parameters: {
      responseBinaryPropertyName: 'data',
      httpMethod: 'POST',
      path: 'solarstar-employee-test',
      authentication: 'none',
      responseMode: 'onReceived',
      responseCode: 200,
      options: {},
    },
  });
}

if (!hasBuildNode) {
  current.nodes.push({
    id: '44c595e3-38db-4b61-b7d7-ae912b2da440',
    name: 'Build Employee Test Messages',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [480, 500],
    parameters: {
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
    },
  });
}

if (!hasSendNode) {
  current.nodes.push({
    id: '699b49e0-8503-4224-9144-f53bc74a9d68',
    webhookId: 'e1965246-f916-4fd4-b617-dceb33125df6',
    name: 'Send Employee Test Email',
    type: 'n8n-nodes-base.microsoftOutlook',
    typeVersion: 2,
    position: [760, 500],
    parameters: {
      resource: 'message',
      operation: 'send',
      toRecipients: '={{$json.email}}',
      subject: '={{$json.subject}}',
      bodyContent: '={{$json.body_html}}',
      additionalFields: {
        bodyContentType: 'HTML',
      },
    },
    credentials: {
      microsoftOutlookOAuth2Api: {
        id: 'CWeYIuXpSepKw28k',
        name: 'SolarStar Service Mailbox (solarstar2@outlook.com)',
      },
    },
  });
}

current.connections = current.connections ?? {};
current.connections['Employee Test Trigger'] = {
  main: [[{ node: 'Build Employee Test Messages', type: 'main', index: 0 }]],
};
current.connections['Build Employee Test Messages'] = {
  main: [[{ node: 'Send Employee Test Email', type: 'main', index: 0 }]],
};

const payload = {
  name: current.name,
  nodes: current.nodes,
  connections: current.connections,
  settings: {
    executionOrder: current.settings?.executionOrder ?? 'v1',
  },
};

const updated = await api(`/workflows/${workflowId}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
});

console.log(JSON.stringify({
  workflowId: updated.id,
  updatedAt: updated.updatedAt,
  nodeCount: updated.nodes.length,
  connectionCount: Object.keys(updated.connections ?? {}).length,
}, null, 2));
