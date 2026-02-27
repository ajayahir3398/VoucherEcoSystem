import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
    selector: 'app-audit-logs',
    standalone: true,
    imports: [CommonModule],
    providers: [DatePipe],
    templateUrl: './audit-logs.component.html',
    styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit {
    logs = signal<any[]>([]);
    page = signal(1);
    limit = signal(20);

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.loadLogs();
    }

    loadLogs() {
        this.adminService.getAuditLogs(this.page(), this.limit()).subscribe({
            next: (res) => this.logs.set(res.items),
            error: (err) => console.error('Failed to load audit logs', err)
        });
    }

    getActionIcon(action: string): string {
        if (action.includes('CREATE')) return '➕';
        if (action.includes('UPDATE')) return '✏️';
        if (action.includes('DELETE')) return '🗑️';
        if (action.includes('BULK')) return '📦';
        return '📝';
    }

    formatDetails(details: any): string {
        return JSON.stringify(details, null, 2);
    }
}
