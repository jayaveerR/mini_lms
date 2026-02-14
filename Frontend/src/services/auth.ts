import { toast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
    id: string;
    email: string;
    role: string;
    name?: string;
    createdAt?: string;
}

interface AuthResponse {
    user: User;
    token: string;
}

interface LoginCredentials {
    email: string;
    password: string;
}

interface SignupCredentials extends LoginCredentials {
    name: string;
}

interface InstructorRequestData extends SignupCredentials {
    institution?: string;
    department?: string;
    message?: string;
}

export const authService = {
    async login(credentials: LoginCredentials, role: string): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...credentials, role }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');

        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    async loginStudent(credentials: LoginCredentials): Promise<AuthResponse> {
        return this.login(credentials, 'student');
    },

    async loginAdmin(credentials: LoginCredentials): Promise<AuthResponse> {
        // Backend treats admin login same as others, just validates role
        // Assuming your backend supports 'admin' role in the role check or ignores it if not specified but user is admin.
        // If your backend strictly validates role vs user.role, you must pass 'admin'.
        return this.login(credentials, 'admin');
    },

    async signupStudent(credentials: SignupCredentials): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...credentials, role: 'student' }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Signup failed');

        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    async loginInstructor(credentials: LoginCredentials): Promise<AuthResponse> {
        return this.login(credentials, 'instructor');
    },

    async requestInstructorAccess(data: InstructorRequestData): Promise<void> {
        // The backend uses the same signup route for instructor requests
        // It handles the 'pending' status for instructors automatically
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, role: 'instructor' }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Request failed');
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    },

    getToken() {
        const token = localStorage.getItem('token');
        if (!token || token === 'undefined' || token === 'null') return null;
        return token;
    },

    getUser(): User | null {
        const userStr = localStorage.getItem('user');
        if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    },

    isAuthenticated() {
        const token = this.getToken();
        return !!token;
    },

    async getProfile() {
        const token = this.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
        return data.user;
    },

    async updateProfile(profileData: any) {
        const token = this.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401) this.logout();
            throw new Error(data.message || 'Failed to update profile');
        }
        
        // Update local storage user data
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
    },

    async handleResponse(response: Response) {
        if (response.status === 401) {
            this.logout();
            // Optional: redirect to appropriate login page based on current path
            const path = window.location.pathname;
            if (path.startsWith('/admin')) window.location.href = '/admin/login';
            else if (path.startsWith('/instructor')) window.location.href = '/instructor/login';
            else if (path.startsWith('/student')) window.location.href = '/student/login';
            else window.location.href = '/';
            
            throw new Error('Unauthorized. Please login again.');
        }
        return response;
    }
};
