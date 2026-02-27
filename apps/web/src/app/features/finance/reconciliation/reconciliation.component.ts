import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, EodReportPayload } from '../../../core/services/admin.service';

@Component({
  selector: 'app-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reconciliation.component.html',
  styleUrls: ['./reconciliation.component.scss']
})
export class ReconciliationComponent implements OnInit {

  isLoading = signal<boolean>(true);
  eodData = signal<EodReportPayload | null>(null);
  selectedDate = signal<string>(this.getTodayDateString());

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.fetchReport(this.selectedDate());
  }

  fetchReport(date: string) {
    this.isLoading.set(true);
    this.adminService.getEodReport(date).subscribe({
      next: (data) => {
        this.eodData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load EOD report', err);
        this.isLoading.set(false);
      }
    });
  }

  onDateChange() {
    this.fetchReport(this.selectedDate());
  }

  exportTaxReport() {
    this.adminService.downloadTaxExport(this.selectedDate()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-compliance-${this.selectedDate()}.csv`;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Failed to download tax export', err);
      }
    });
  }

  private getTodayDateString(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
