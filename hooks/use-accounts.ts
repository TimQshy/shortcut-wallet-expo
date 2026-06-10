import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ACCOUNTS_URL } from '../constants/api';

export type Account = {
  id: number;
  user_id: string;
  name: string;
  created_at: string;
};

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAccounts = useCallback(async (userId: string) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${userId}`);
      const text = await response.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAccount = async (userId: string, name: string) => {
    try {
      const response = await fetch(`${ACCOUNTS_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, name }),
      });
      if (!response.ok) throw new Error('Failed to create account');
      const created = await response.json();
      setAccounts((prev) => [created, ...prev]);
      return created;
    } catch (error) {
      console.error('Error creating account:', error);
      Alert.alert('Ошибка', 'Не удалось создать счёт');
      return null;
    }
  };

  const deleteAccount = async (id: number) => {
    try {
      const response = await fetch(`${ACCOUNTS_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete account');
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Ошибка', 'Не удалось удалить счёт');
    }
  };

  return { accounts, isLoading, loadAccounts, createAccount, deleteAccount };
};
