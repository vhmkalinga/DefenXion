/**
 * DefenXion — Shared PDF Report Generator
 * Used by ReportsLogs.tsx and SecurityCopilot.tsx.
 */

export interface ReportData {
  report_id: string;
  title: string;
  generated_at: string;
  generated_by: string;
  period: string;
  period_type?: string;
  summary?: {
    total_detections?: number;
    total_blocks?: number;
    total_alerts?: number;
    active_alerts?: number;
    total_logs?: number;
  };
  top_attack_sources?: { ip: string; count: number }[];
  action_distribution?: { action: string; count: number }[];
}

function actionColor(action: string): string {
  if (action === 'CRITICAL_BLOCK') return '#dc2626';
  if (action === 'BLOCK_IP') return '#ea580c';
  if (action === 'ALERT_ADMIN') return '#d97706';
  return '#16a34a';
}

function buildPDFHtml(report: ReportData): string {
  const s = report.summary || {};
  const total = s.total_detections ?? 0;

  const statsRows = [
    { label: 'Total Detections', value: total.toLocaleString(), color: '#1d4ed8' },
    { label: 'IP Blocks',        value: (s.total_blocks ?? 0).toLocaleString(), color: '#dc2626' },
    { label: 'Total Alerts',     value: (s.total_alerts ?? 0).toLocaleString(), color: '#d97706' },
    { label: 'Active Alerts',    value: (s.active_alerts ?? 0).toLocaleString(), color: '#7c3aed' },
    { label: 'Log Entries',      value: (s.total_logs ?? 0).toLocaleString(),    color: '#15803d' },
  ];

  const statsHtml = statsRows
    .map(
      (st) => `
      <div style="flex:1;min-width:130px;border:1px solid #e5e7eb;border-radius:10px;padding:16px 14px;text-align:center;background:#f9fafb;">
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">${st.label}</div>
        <div style="font-size:28px;font-weight:800;color:${st.color}">${st.value}</div>
      </div>`
    )
    .join('');

  const attackRows = report.top_attack_sources?.length
    ? report.top_attack_sources
        .map(
          (src, i) => `
        <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
          <td style="padding:10px 14px;border:1px solid #e5e7eb;font-family:monospace;font-size:13px;color:#111827">${src.ip}</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#dc2626;font-weight:700;text-align:center">${src.count}</td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="2" style="padding:14px;border:1px solid #e5e7eb;color:#9ca3af;text-align:center">No attack sources recorded in this period.</td></tr>`;

  const actionRows = report.action_distribution?.length
    ? report.action_distribution
        .map((a) => {
          const pct = total > 0 ? Math.round((a.count / total) * 100) : 0;
          const color = actionColor(a.action);
          return `
        <tr>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#111827;font-weight:600">${a.action}</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:center">${a.count}</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;min-width:140px">
            <div style="height:10px;background:#f3f4f6;border-radius:5px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${color};border-radius:5px"></div>
            </div>
            <div style="font-size:10px;color:#6b7280;margin-top:3px;text-align:right">${pct}%</div>
          </td>
        </tr>`;
        })
        .join('')
    : `<tr><td colspan="3" style="padding:14px;border:1px solid #e5e7eb;color:#9ca3af;text-align:center">No action data recorded.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;background:#fff}
  </style>
</head>
<body>

  <!-- ── Cover Page ── -->
  <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#1d4ed8 100%);min-height:280px;padding:48px 48px 40px;display:flex;flex-direction:column;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:14px">
      <div style="width:46px;height:46px;background:rgba(255,255,255,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.25)">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <div>
        <div style="color:rgba(255,255,255,0.9);font-size:20px;font-weight:800;letter-spacing:-.5px">DefenXion</div>
        <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:1px">Security Intelligence Platform</div>
      </div>
    </div>
    <div style="margin-top:36px">
      <div style="color:rgba(255,255,255,0.6);font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Security Report</div>
      <h1 style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-.5px;line-height:1.2">${report.title}</h1>
      <div style="display:flex;gap:24px;margin-top:20px;flex-wrap:wrap">
        <div style="color:rgba(255,255,255,0.7);font-size:12px"><span style="color:rgba(255,255,255,0.45)">Report ID </span>${report.report_id}</div>
        <div style="color:rgba(255,255,255,0.7);font-size:12px"><span style="color:rgba(255,255,255,0.45)">Generated </span>${report.generated_at}</div>
        <div style="color:rgba(255,255,255,0.7);font-size:12px"><span style="color:rgba(255,255,255,0.45)">By </span>${report.generated_by}</div>
        <div style="color:rgba(255,255,255,0.7);font-size:12px"><span style="color:rgba(255,255,255,0.45)">Period </span>${report.period}</div>
      </div>
    </div>
  </div>

  <!-- ── Body ── -->
  <div style="padding:40px 48px">

    <!-- Summary Stats -->
    <div style="margin-bottom:36px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
        <div style="width:3px;height:20px;background:#1d4ed8;border-radius:2px"></div>
        <h2 style="font-size:16px;font-weight:700;color:#111827">Summary Overview</h2>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">${statsHtml}</div>
    </div>

    <!-- Top Attack Sources -->
    <div style="margin-bottom:36px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
        <div style="width:3px;height:20px;background:#dc2626;border-radius:2px"></div>
        <h2 style="font-size:16px;font-weight:700;color:#111827">Top Attack Sources</h2>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#1d4ed8">
            <th style="padding:11px 14px;text-align:left;font-size:12px;color:white;font-weight:600;border:1px solid #1d4ed8">IP Address</th>
            <th style="padding:11px 14px;text-align:center;font-size:12px;color:white;font-weight:600;border:1px solid #1d4ed8">Attack Count</th>
          </tr>
        </thead>
        <tbody>${attackRows}</tbody>
      </table>
    </div>

    <!-- Action Distribution -->
    <div style="margin-bottom:36px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
        <div style="width:3px;height:20px;background:#d97706;border-radius:2px"></div>
        <h2 style="font-size:16px;font-weight:700;color:#111827">Response Action Distribution</h2>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#1d4ed8">
            <th style="padding:11px 14px;text-align:left;font-size:12px;color:white;font-weight:600;border:1px solid #1d4ed8">Action Taken</th>
            <th style="padding:11px 14px;text-align:center;font-size:12px;color:white;font-weight:600;border:1px solid #1d4ed8;width:80px">Count</th>
            <th style="padding:11px 14px;text-align:left;font-size:12px;color:white;font-weight:600;border:1px solid #1d4ed8;width:180px">Distribution</th>
          </tr>
        </thead>
        <tbody>${actionRows}</tbody>
      </table>
    </div>

  </div>

  <!-- ── Footer ── -->
  <div style="margin:0 48px;padding:16px 0;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:10px;color:#9ca3af">Generated by DefenXion Security Intelligence Platform</span>
    <span style="font-size:10px;color:#9ca3af;font-weight:600;letter-spacing:.5px;text-transform:uppercase">Confidential</span>
  </div>

</body>
</html>`;
}

export async function generateReportPDF(report: ReportData): Promise<void> {
  const htmlContent = buildPDFHtml(report);

  // Inject a print-trigger page into a hidden iframe.
  // This completely avoids html2canvas (and its oklch color-parsing bug in Chrome 111+).
  // The browser renders our inline-styled HTML natively → sharp vector text, no canvas issues.
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:816px;height:1056px;' +
    'border:none;visibility:hidden;pointer-events:none;';
  document.body.appendChild(iframe);

  return new Promise<void>((resolve, reject) => {
    iframe.onload = () => {
      try {
        const win = iframe.contentWindow!;

        // Override the print dialog title to the report filename
        const doc = iframe.contentDocument!;
        const titleEl = doc.querySelector('title');
        if (titleEl) titleEl.textContent = `${report.report_id}.pdf`;

        // Inject a @media print stylesheet so the page looks exactly right when printed to PDF
        const printStyle = doc.createElement('style');
        printStyle.textContent = `
          @media print {
            @page { margin: 0; size: A4 portrait; }
            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `;
        doc.head.appendChild(printStyle);

        // Small delay to let the iframe finish layout before printing
        setTimeout(() => {
          try {
            win.focus();
            win.print();
            // Clean up after a short delay (print dialog may still be open)
            setTimeout(() => {
              try { document.body.removeChild(iframe); } catch { /* already removed */ }
              resolve();
            }, 1500);
          } catch (e) {
            reject(e);
          }
        }, 300);
      } catch (e) {
        reject(e);
      }
    };

    iframe.onerror = reject;
    iframe.srcdoc = htmlContent;
  });
}
