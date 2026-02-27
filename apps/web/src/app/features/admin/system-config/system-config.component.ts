import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, SystemConfigPayload } from '../../../core/services/admin.service';

@Component({
    selector: 'app-system-config',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './system-config.component.html',
    styleUrls: ['./system-config.component.scss']
})
export class SystemConfigComponent implements OnInit {
    configs = signal<SystemConfigPayload[]>([]);

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.loadConfig();
    }

    loadConfig() {
        this.adminService.getConfig().subscribe({
            next: (configs) => this.configs.set(configs),
            error: (err) => console.error('Failed to load system config', err)
        });
    }

    saveConfig(config: SystemConfigPayload) {
        this.adminService.updateConfig(config).subscribe({
            next: () => console.log('Saved config:', config.key),
            error: (err) => console.error('Failed to save config', err)
        });
    }
    toggleBooleanConfig(config: SystemConfigPayload, checked: boolean) {
        config.value = checked ? 'true' : 'false';
        this.saveConfig(config);
    }
}
