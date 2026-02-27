import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AnomalyReportPayload } from '../../../core/services/admin.service';

@Component({
    selector: 'app-anomaly-detection',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './anomaly-detection.component.html',
    styleUrls: ['./anomaly-detection.component.scss']
})
export class AnomalyDetectionComponent implements OnInit {
    isLoading = signal<boolean>(true);
    anomalyData = signal<AnomalyReportPayload | null>(null);

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.adminService.getAnomalies().subscribe({
            next: (data) => {
                this.anomalyData.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Failed to load anomalies', err);
                this.isLoading.set(false);
            }
        });
    }
}
