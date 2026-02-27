import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

interface IssuanceResults {
    totalTargeted?: number;
    successCount?: number;
    errorCount?: number;
}

@Component({
    selector: 'app-bulk-issuance',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './bulk-issuance.component.html',
    styleUrls: ['./bulk-issuance.component.scss']
})
export class BulkIssuanceComponent {
    isDragging = signal(false);
    selectedFile = signal<File | null>(null);
    isProcessing = signal(false);
    results = signal<IssuanceResults | null>(null);

    constructor(private adminService: AdminService) { }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.isDragging.set(true);
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        this.isDragging.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.isDragging.set(false);

        if (event.dataTransfer?.files.length) {
            this.handleFile(event.dataTransfer.files[0]);
        }
    }

    onFileSelected(event: any) {
        if (event.target.files.length) {
            this.handleFile(event.target.files[0]);
        }
    }

    private handleFile(file: File) {
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            this.selectedFile.set(file);
            this.results.set(null);
        } else {
            alert('Please upload a valid CSV file.');
        }
    }

    removeFile() {
        this.selectedFile.set(null);
        this.results.set(null);
    }

    downloadTemplate() {
        const headers = 'Employee ID,Coupon Type ID,Quantity\n';
        const dummyRow = 'EMP-1042,abc-123-uuid,5\n';
        const csvContent = headers + dummyRow;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'bulk_issuance_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    processIssuance() {
        if (!this.selectedFile()) return;

        this.isProcessing.set(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);

            try {
                const items = lines.slice(1).map(line => {
                    const parts = line.split(',');
                    if (parts.length < 3) throw new Error('Invalid CSV format. Expected: Employee ID, Coupon Type ID, Quantity');
                    return {
                        employeeId: parts[0].trim(),
                        couponTypeId: parts[1].trim(),
                        quantity: parseInt(parts[2].trim(), 10)
                    };
                });

                this.adminService.bulkIssueCoupons({ items }).subscribe({
                    next: (res) => {
                        this.isProcessing.set(false);
                        this.results.set({
                            totalTargeted: items.length,
                            successCount: items.length,
                            errorCount: 0
                        });
                    },
                    error: (err) => {
                        console.error(err);
                        this.isProcessing.set(false);
                        alert('Bulk issuance failed.');
                    }
                });
            } catch (err: any) {
                this.isProcessing.set(false);
                alert(err && err.message ? err.message : 'Error parsing CSV file');
            }
        };
        reader.onerror = () => {
            this.isProcessing.set(false);
            alert('Error reading the file.');
        };

        reader.readAsText(this.selectedFile()!);
    }
}
