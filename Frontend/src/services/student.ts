import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const studentService = {
    // Get all published courses (Explore)
    getAllCourses: async (category?: string, search?: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        let query = `${API_URL}/student/courses?`;
        if (category) query += `category=${encodeURIComponent(category)}&`;
        if (search) query += `search=${encodeURIComponent(search)}&`;

        const response = await fetch(query, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        await authService.handleResponse(response);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch courses');
        return data;
    },

    // Get student's enrolled courses
    getEnrolledCourses: async () => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/my-courses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        await authService.handleResponse(response);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch enrolled courses');
        return data;
    },

    // Enroll in a course
    enrollCourse: async (courseId: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to enroll in course');
        return data;
    },

    // Get full course content (Player)
    getCourse: async (courseId: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/courses/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch course content');
        return data;
    },

    // Mark video as completed
    markVideoCompleted: async (courseId: string, moduleId: string, contentId: string, duration: number) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/progress/video`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                courseId, moduleId, contentId, watchTime: duration
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update progress');
        return data;
    },

    // Get course progress
    getCourseProgress: async (courseId: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/progress/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch progress');
        return data;
    },

    // Manually complete course
    completeCourse: async (courseId: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/progress/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ courseId })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to complete course');
        return data;
    },

    // Reset course progress (Re-attempt)
    resetCourseProgress: async (courseId: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/progress/reset`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ courseId })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to reset course');
        return data;
    },

    // Get detailed progress report
    getProgressReport: async () => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/progress-report`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch progress report');
        return data;
    },

    // Get all quizzes for student
    getQuizzes: async () => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/quizzes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch quizzes');
        return data.quizzes;
    },

    // Get quiz details
    getQuiz: async (quizId: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/quiz/${quizId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch quiz');
        return data;
    },

    // Submit quiz
    submitQuiz: async (quizId: string, answers: any[], timeSpent: number) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/quiz/${quizId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers, timeSpent })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to submit quiz');
        return data;
    },

    // Get study materials for a course
    getMaterials: async (courseId: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/courses/${courseId}/materials`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch materials');
        return data.materials;
    },

    // Discussions
    getDiscussions: async (courseId: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/courses/${courseId}/discussions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch discussions');
        return data.discussions;
    },

    createDiscussion: async (courseId: string, title: string, content: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/discussions`, {
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

    addReply: async (discussionId: string, content: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/discussions/${discussionId}/reply`, {
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

    toggleLike: async (discussionId: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/discussions/${discussionId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to toggle like');
        return data.likes;
    },

    toggleHelpful: async (discussionId: string, replyId: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/discussions/${discussionId}/replies/${replyId}/helpful`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to toggle helpful');
        return data.helpfulCount;
    },

    deleteDiscussion: async (discussionId: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/discussions/${discussionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete discussion');
        return data;
    },

    deleteReply: async (discussionId: string, replyId: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/discussions/${discussionId}/replies/${replyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete reply');
        return data;
    },

    // Notifications
    getNotifications: async () => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch notifications');
        return data.notifications;
    },

    markNotificationRead: async (id: string) => {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/student/notifications/${id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to mark notification as read');
        return data.notification;
    }
};
