import { apiClient } from '@/api';
import { useTheme } from '@/contexts/ThemeContext';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react'
import type { Notification } from "../types/notifications";
import type { PaymentMethod } from "../interfaces/paymentMethodInterface";

export default function useHeader(session: any) {
	const { isDark, toggleTheme } = useTheme();
	const [notifications, setNotifications] = useState<
		Notification[]
	>([]);
	const [showNotificationModal, setShowNotificationModal] =
		useState(false);
	const [selectedNotification, setSelectedNotification] =
		useState<Notification | null>(null);
	const unreadCount = notifications.filter(
		(n: Notification) => !n.seen
	).length;
	const [loading, setLoading] = useState(false);
	const [paymentMethods, setPaymentMethods] = useState<
		PaymentMethod[]
	>([]);
	function handleSelectNotification(notification: Notification) {
		setSelectedNotification(notification);
		setShowNotificationModal(true);
	}

	function handleCloseNotificationModal() {
		setShowNotificationModal(false);
		setSelectedNotification(null);
	}

	const fetchData = useCallback(async () =>{
		if (session?.user?.id) {
			try {
				setLoading(true);
				const [notificationsResponse, paymentMethodsResponse] = await Promise.all([
					apiClient.get(`/notifications/${session.user.id}`),
					apiClient.get('/payment-methods')
				]);

				if (notificationsResponse.status >= 200 && notificationsResponse.status < 300 && notificationsResponse.data.notifications) {
					setNotifications(notificationsResponse.data.notifications);
				}

				if (paymentMethodsResponse.status >= 200 && paymentMethodsResponse.status < 300 && paymentMethodsResponse.data.paymentMethods) {
					setPaymentMethods(paymentMethodsResponse.data.paymentMethods);
				}
				setLoading(false);
			} catch (error) {
				console.error("Error fetching notifications:", error);
				setLoading(false);
			} finally {
				setLoading(false);
			}
		}
	}, [session?.user?.id]);

	const fetchNotifications = useCallback(async () => {
		if (session?.user?.id) {
			try {
				setLoading(true);
				const response = await apiClient.get(
					`/notifications/${session.user.id}`
				);
				if (response.data && response.data.notifications) {
					setNotifications(response.data.notifications);
					setLoading(false);
				}
			} catch (error) {
				console.error("Error fetching notifications:", error);
				setLoading(false);
			} finally {
				setLoading(false);
			}
		}
	}, [session?.user?.id]);

	async function markAsRead(idsNotifications: number[]) {
		await axios.put(
			`${
				import.meta.env.VITE_API_BASE_URL
			}/notifications/mark-notifications-read`,
			{
				idsNotifications: idsNotifications,
			}
		)
		fetchNotifications();

	}

	useEffect(() => {
		fetchData();
	}, []);
	return {
		isDark,
		toggleTheme,
		notifications,
		unreadCount,
		loading,
		handleSelectNotification,
		handleCloseNotificationModal,
		showNotificationModal,
		selectedNotification,
		markAsRead,
		setNotifications,
		setSelectedNotification,
		setShowNotificationModal,
		paymentMethods
  }
}
