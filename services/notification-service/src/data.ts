import { Notification } from './types';

const notifications: Notification[] = [];

export function addNotification(notification: Notification): void {
  notifications.push(notification);
}

export function getNotifications(): Notification[] {
  return notifications;
}
