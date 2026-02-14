import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Info, MessageSquare, Star, Trophy } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { studentService } from '@/services/student';
import { instructorService } from '@/services/instructor';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
    _id: string;
    type: 'NEW_THREAD' | 'NEW_REPLY' | 'MENTION' | 'ACCEPTED_ANSWER' | 'ENDORSEMENT';
    title: string;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationBellProps {
    role: 'student' | 'instructor';
}

export const NotificationBell = ({ role }: NotificationBellProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const service = role === 'student' ? studentService : instructorService;

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await service.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [service]);

    useEffect(() => {
        fetchNotifications();
        // Poll for notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkRead = async (id: string) => {
        try {
            await service.markNotificationRead(id);
            setNotifications(notifications.map(n => 
                n._id === id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'NEW_THREAD': return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'NEW_REPLY': return <MessageSquare className="h-4 w-4 text-green-500" />;
            case 'ACCEPTED_ANSWER': return <Trophy className="h-4 w-4 text-yellow-500" />;
            case 'ENDORSEMENT': return <Star className="h-4 w-4 text-purple-500" />;
            default: return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
                            variant="destructive"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">
                            {unreadCount} unread
                        </span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem 
                                key={notification._id}
                                className={cn(
                                    "flex flex-col items-start p-4 cursor-pointer transition-colors",
                                    !notification.isRead && "bg-muted/50"
                                )}
                                onClick={() => handleMarkRead(notification._id)}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    {getIcon(notification.type)}
                                    <span className="font-semibold text-sm flex-1">{notification.title}</span>
                                    {!notification.isRead && (
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {notification.message}
                                </p>
                                <span className="text-[10px] text-muted-foreground mt-2">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
