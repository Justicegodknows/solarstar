import { describe, expect, it } from 'vitest';
import { renderMaintenanceReminderHtml } from '../workflows/solarflar/email-templates';

describe('renderMaintenanceReminderHtml', () => {
    it('renders the maintenance reminder HTML with signature and contact details', () => {
        const html = renderMaintenanceReminderHtml({
            greeting: 'Hallo Max,',
            bodyHtml: 'Ihre Anlage braucht Aufmerksamkeit.',
            ctaHref: 'https://www.juergenhohnen.de/termin-vereinbaren/',
        });

        expect(html).toContain('Mehmet Yilmaz');
        expect(html).toContain('termin-vereinbaren');
        expect(html).toContain('mehmet@juergenhohnen.de');
        expect(html).toContain('Hallo Max');
    });
});
