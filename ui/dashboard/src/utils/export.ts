export function downloadCSV(data: any[], filename: string) {
    if (!data || data.length === 0) return;

    // Extract headers
    const headers = Object.keys(data[0]);

    // Format CSV rows
    const csvRows = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(fieldName => {
                let cell = row[fieldName] === null || row[fieldName] === undefined
                    ? ''
                    : String(row[fieldName]);

                // Escape quotes and commas
                cell = cell.replace(/"/g, '""');
                if (cell.search(/("|,|\n)/g) >= 0) {
                    cell = `"${cell}"`;
                }
                return cell;
            }).join(',')
        )
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    // Create download link and trigger
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
