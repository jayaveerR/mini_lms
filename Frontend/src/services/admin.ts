import { authService } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface InstructorRequest {
    _id: string;
    name: string;
    email: string;
    institution: string;
    department: string;
    bio: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
}

export const adminService = {
    async getPendingInstructors(): Promise<InstructorRequest[]> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/admin/instructors/pending`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        await authService.handleResponse(response);
        if (!response.ok) throw new Error('Failed to fetch pending requests');

        const data = await response.json();
        return data.instructors;
    },

    async getAllInstructors(status?: string): Promise<InstructorRequest[]> {
        const token = authService.getToken();
        const url = status
            ? `${API_URL}/admin/instructors?status=${status}`
            : `${API_URL}/admin/instructors`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        await authService.handleResponse(response);
        if (!response.ok) throw new Error('Failed to fetch instructors');

        const data = await response.json();
        return data.instructors;
    },

    async approveInstructor(id: string): Promise<void> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/admin/instructors/${id}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        await authService.handleResponse(response);
        if (!response.ok) throw new Error('Failed to approve instructor');
    },

    async rejectInstructor(id: string, reason?: string): Promise<void> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/admin/instructors/${id}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });

        await authService.handleResponse(response);
        if (!response.ok) throw new Error('Failed to reject instructor');
    },

    async getAllUsers(role?: string, status?: string): Promise<any[]> {
        const token = authService.getToken();
        let url = `${API_URL}/admin/users?`;
        if (role) url += `role=${role}&`;
        if (status) url += `status=${status}&`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await authService.handleResponse(response);
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        return data.users;
    },

    async updateUserStatus(id: string, status: string): Promise<void> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/admin/users/${id}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        await authService.handleResponse(response);
        if (!response.ok) throw new Error('Failed to update user status');
    },

    async getAllCourses(status?: string): Promise<any[]> {
        const token = authService.getToken();
        let url = `${API_URL}/admin/courses?`;
        if (status) url += `status=${status}&`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await authService.handleResponse(response);
        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();
        return data.courses;
    },

    async updateCourseStatus(id: string, status: string): Promise<void> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/admin/courses/${id}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        await authService.handleResponse(response);
        if (!response.ok) throw new Error('Failed to update course status');
    },

    async getAnalytics(): Promise<any> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/admin/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await authService.handleResponse(response);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        return data.analytics;
    },

    async getSettings(): Promise<any> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/admin/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await authService.handleResponse(response);
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        return data.settings;
    },

    async updateSettings(settings: any): Promise<any> {
        const token = authService.getToken();
        const response = await fetch(`${API_URL}/admin/settings`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        await authService.handleResponse(response);
        if (!response.ok) throw new Error('Failed to update settings');
        const data = await response.json();
        return data.settings;
    }
};
