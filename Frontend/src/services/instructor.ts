import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface DashboardSummary {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalStudents: number;
    activeStudents: number;
    activeQuizzes: number;
    recentActivities: {
        _id: string;
        type: string;
        description: string;
        timestamp: string;
        courseID?: { title: string };
        contentID?: { title: string };
        userID?: { name: string };
    }[];
}

export interface Option {
    text: string;
    isCorrect?: boolean;
}

export interface Question {
    questionText: string;
    options: Option[];
    correctAnswer?: string;
    points?: number;
    type?: 'multiple-choice' | 'true-false';
}

export interface CreateCourseData {
    title: string;
    description: string;
    category: string;
    level?: string;
    price?: number;
    thumbnail?: string;
}

export interface CreateQuizData {
    title: string;
    courseID: string;
    questions: Question[];
    timeLimit?: number;
    passingPercentage?: number;
}

export interface CreateModuleData {
    title: string;
    courseID: string;
    order?: number;
}

export interface CreateContentData {
    title: string;
    moduleID: string;
    contentType: 'video' | 'text' | 'quiz' | 'pdf';
    videoURL?: string;
    description?: string;
    content?: string;
    duration?: number;
}

export const instructorService = {
    async getDashboardSummary(): Promise<DashboardSummary> {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/dashboard/summary`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        await authService.handleResponse(response);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch dashboard summary');

        return data.summary;
    },

    async getCourses() {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/courses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        await authService.handleResponse(response);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch courses');
        return data.courses;
    },

    async getQuizzes() {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/quizzes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch quizzes');
        return data.quizzes || [];
    },

    async deleteQuiz(quizId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/quizzes/${quizId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete quiz');
        return data;
    },

    async generateQuiz(context: string, difficulty: string = 'intermediate', questionCount: number = 5) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/quizzes/generate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ context, difficulty, questionCount })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to generate quiz');
        return data.questions;
    },

    async getMaterials(courseId?: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const url = courseId
            ? `${API_URL}/instructor/materials?courseId=${courseId}`
            : `${API_URL}/instructor/materials`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch materials');
        return data.materials;
    },

    async uploadMaterial(formData: FormData) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/materials`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Note: Don't set Content-Type for FormData, browser will set it with boundary
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to upload material');
        return data.material;
    },

    async deleteMaterial(id: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/materials/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete material');
        return data;
    },

    async suggestOptions(questionText: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/quizzes/suggest-options`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ questionText })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to suggest options');
        return data.options;
    },

    async createCourse(courseData: CreateCourseData) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/courses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create course');
        return data.course;
    },

    async createQuiz(quizData: CreateQuizData) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/quizzes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(quizData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create quiz');
        return data.quiz;
    },
    async getCourse(courseId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/courses/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch course');
        return data; // Returns { course, modules }
    },

    async createModule(moduleData: CreateModuleData) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/modules`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(moduleData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create module');
        return data.module;
    },

    async createContent(contentData: CreateContentData) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/content`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contentData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create content');
        return data.content;
    },

    async publishCourse(courseId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/courses/${courseId}/publish`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to publish course');
        return data.course;
    },

    async unpublishCourse(courseId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/courses/${courseId}/unpublish`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to unpublish course');
        return data.course;
    },

    async deleteModule(moduleId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/modules/${moduleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete module');
        return data; // Returns success message
    },

    async deleteCourse(courseId: string) { // Soft delete or Archive
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        // Assuming DELETE /courses/:id deletes it. If backend implements soft delete, this is fine.
        // User asked for "delete, then permanently delete". 
        // Typically this means: "Move to Trash" then "Delete Forever".
        // But if backend only has one DELETE endpoint, we'll use that.
        // Let's implement deleteCourse which calls the standard DELETE endpoint.

        const response = await fetch(`${API_URL}/instructor/courses/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete course');
        return data;
    },

    async permanentDeleteCourse(courseId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        // Use a query param or specific endpoint for permanent deletion if backend supports it.
        // Since we modified moduleController to do cascading delete, let's assume the courseController 
        // also needs to support this or we just call the same endpoint if it's already destructive.
        // For now, mapping to same endpoint as we don't have separate trash logic in backend yet.
        // We will assume "Delete" means permanent for now as per typical REST.

        const response = await fetch(`${API_URL}/instructor/courses/${courseId}?permanent=true`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to permanently delete course');
        return data;
    },

    async restoreCourse(courseId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'draft' })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to restore course');
        return data.course;
    },

    async getStudents(search?: string, status?: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        let url = `${API_URL}/instructor/students?`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (status) url += `status=${encodeURIComponent(status)}&`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch students');
        return data.students;
    },

    async getStudentDetail(studentId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/students/${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch student detail');
        return data.studentDetail;
    },

    async getCourseAnalytics(courseId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/analytics/courses/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch analytics');
        return data.analytics;
    },

    // Discussion Methods
    async getCourseDiscussions(courseId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/courses/${courseId}/discussions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch discussions');
        return data.discussions;
    },

    async createDiscussion(courseId: string, title: string, content: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/discussions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ courseID: courseId, title, content })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create discussion');
        return data.discussion;
    },

    async addReply(discussionId: string, content: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/discussions/${discussionId}/reply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add reply');
        return data.discussion;
    },

    async updateDiscussionStatus(discussionId: string, status: 'OPEN' | 'RESOLVED' | 'CLOSED') {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/discussions/${discussionId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update status');
        return data.discussion;
    },

    async markAcceptedAnswer(discussionId: string, replyId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/discussions/${discussionId}/replies/${replyId}/accept`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to accept answer');
        return data.discussion;
    },

    async togglePin(discussionId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/discussions/${discussionId}/pin`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to toggle pin');
        return data.isPinned;
    },

    async toggleHelpful(discussionId: string, replyId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/discussions/${discussionId}/replies/${replyId}/helpful`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to toggle helpful');
        return data.helpfulCount;
    },

    async toggleEndorsement(discussionId: string, replyId: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/discussions/${discussionId}/replies/${replyId}/endorse`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to toggle endorsement');
        return data.isInstructorEndorsed;
    },

    async deletePost(discussionId: string, replyId?: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const url = replyId 
            ? `${API_URL}/instructor/discussions/${discussionId}/replies/${replyId}`
            : `${API_URL}/instructor/discussions/${discussionId}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete post');
        return data;
    },

    async getNotifications() {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch notifications');
        return data.notifications;
    },

    async markNotificationRead(id: string) {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/instructor/notifications/${id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to mark notification as read');
        return data.notification;
    }
};
