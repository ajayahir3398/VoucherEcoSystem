import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserPayload } from '../../../core/services/admin.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users = signal<UserPayload[]>([]);
  page = signal(1);
  limit = signal(10);
  total = signal(0);
  isModalOpen = signal(false);
  currentUser = signal<Partial<UserPayload>>({});
  isSaving = signal(false);

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.loadUsers(1);
  }

  loadUsers(pageNumber: number) {
    this.adminService.getUsers(undefined, pageNumber, this.limit()).subscribe({
      next: (res) => {
        this.users.set(res.items);
        this.total.set(res.total);
        this.page.set(res.page);
      },
      error: (err) => console.error('Failed to load users', err)
    });
  }

  openAddModal() {
    this.currentUser.set({ role: 'EMPLOYEE', isActive: true });
    this.isModalOpen.set(true);
  }

  openEditModal(user: UserPayload) {
    this.currentUser.set({ ...user });
    this.isModalOpen.set(true);
  }

  closeAddModal() {
    this.isModalOpen.set(false);
    this.currentUser.set({});
  }

  saveUser() {
    const user = this.currentUser();
    if (!user.name || !user.email || !user.role) {
      alert('Please fill out required fields (name, email, role).');
      return;
    }

    this.isSaving.set(true);

    if (user.id) {
      // Update existing user
      const updatePayload = {
        name: user.name,
        status: user.isActive ? 'active' : 'inactive'
      } as any; // Cast as any since UserPayload doesn't strictly match the backend update DTO in names exactly

      this.adminService.updateUser(user.id, updatePayload).subscribe({
        next: () => {
          this.loadUsers(this.page());
          this.closeAddModal();
          this.isSaving.set(false);
        },
        error: (err) => {
          console.error('Update failed', err);
          alert(err.error?.message || 'Failed to update user.');
          this.isSaving.set(false);
        }
      });
    } else {
      // Create new user
      const newPayload: UserPayload = {
        name: user.name,
        email: user.email,
        role: user.role as any,
        password: user.password || 'ChangeMe123!'
      };

      this.adminService.createUser(newPayload).subscribe({
        next: () => {
          this.loadUsers(1);
          this.closeAddModal();
          this.isSaving.set(false);
        },
        error: (err) => {
          console.error('Creation failed', err);
          alert(err.error?.message || 'Failed to create user.');
          this.isSaving.set(false);
        }
      });
    }
  }

  copyId(id: string) {
    navigator.clipboard.writeText(id).then(() => {
      alert('ID copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy ID: ', err);
      prompt('Copy the ID manually:', id);
    });
  }
}
